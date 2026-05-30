'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from './_guard'
import { clientsRepo } from '@/lib/repositories/clients'
import { subscriptionsRepo } from '@/lib/repositories/subscriptions'
import { sendSubscriptionActiveEmail } from '@/lib/email'
import { calculateExpiry, isValidBillingPeriod, ONE_MONTH, type BillingPeriod } from '@/lib/billing'
import { DomainError, toActionError } from '@/lib/action-error'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/server'
import type { ActionResult, PaymentMethod } from '@/types'

function revalidateClients(id?: string) {
  revalidatePath('/admin/clients')
  if (id) revalidatePath(`/admin/clients/${id}`)
  updateTag('admin-clients')
}

const idSchema = z.string().uuid('ID inválido')

export async function toggleClientActive(clientId: string, isActive: boolean): Promise<ActionResult> {
  if (!idSchema.safeParse(clientId).success) return { success: false, error: 'ID inválido' }
  try {
    const { supabase } = await requireAdmin()
    const { error } = await clientsRepo.setActive(supabase, clientId, isActive)
    if (error) throw error
    revalidateClients()
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function updateClientNotes(clientId: string, notes: string): Promise<ActionResult> {
  if (!idSchema.safeParse(clientId).success) return { success: false, error: 'ID inválido' }
  if (notes.length > 1000) return { success: false, error: 'Notas muito longas (máx 1000 caracteres)' }
  try {
    const { supabase } = await requireAdmin()
    const { error } = await clientsRepo.updateNotes(supabase, clientId, notes)
    if (error) throw error
    revalidateClients(clientId)
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function cancelClientSubscription(
  subscriptionId: string,
  reason: string
): Promise<ActionResult> {
  if (!idSchema.safeParse(subscriptionId).success) return { success: false, error: 'ID inválido' }
  if (typeof reason !== 'string' || reason.length > 200) return { success: false, error: 'Motivo inválido' }
  try {
    const { userId, supabase } = await requireAdmin()

    const rl = await checkRateLimit('adminCancelSub', userId, RATE_LIMITS.adminAction)
    if (!rl.success) throw new DomainError('Muitas ações seguidas. Aguarde 1 minuto.')

    const { data, error } = await subscriptionsRepo.cancel(supabase, subscriptionId, reason)
    if (error) throw error
    if (!data) throw new DomainError('Assinatura não encontrada ou não está ativa.')

    revalidateClients(data.client_id)
    updateTag('admin-kpis')
    updateTag('admin-recent-subs')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

const paymentMethodSchema = z.enum(['pix', 'credit_card', 'debit_card', 'cash', 'plan'])

export async function activateSubscription(
  subscriptionId: string,
  paymentMethod: PaymentMethod,
  period: BillingPeriod = ONE_MONTH
): Promise<ActionResult> {
  if (!idSchema.safeParse(subscriptionId).success) return { success: false, error: 'ID inválido' }
  if (!paymentMethodSchema.safeParse(paymentMethod).success) return { success: false, error: 'Método de pagamento inválido' }
  if (!isValidBillingPeriod(period)) return { success: false, error: 'Duração inválida' }

  try {
    const { userId, supabase } = await requireAdmin()

    const rl = await checkRateLimit('adminActivateSub', userId, RATE_LIMITS.adminAction)
    if (!rl.success) throw new DomainError('Muitas ações seguidas. Aguarde 1 minuto.')

    const now = new Date()
    const expiresAt = calculateExpiry(now, period)

    const { data, error } = await subscriptionsRepo.activate(supabase, subscriptionId, {
      started_at:     now.toISOString(),
      expires_at:     expiresAt.toISOString(),
      payment_method: paymentMethod,
    })
    if (error || !data) throw error ?? new DomainError('Assinatura não encontrada ou já ativada')

    revalidatePath('/admin/subscriptions')
    revalidatePath(`/admin/clients/${data.client_id}`)
    updateTag('admin-kpis')
    updateTag('admin-recent-subs')

    // CRITICO: auth.admin.* exige service_role. O `supabase` do requireAdmin
    // é cliente anon — chamada falhava silenciosa, email nunca chegava.
    const client = data.client as any
    const plan   = data.plan   as any
    if (client?.id) {
      const adminCli = await createAdminClient()
      const { data: authUser } = await adminCli.auth.admin.getUserById(client.id)
      const email = authUser?.user?.email
      if (email) {
        await sendSubscriptionActiveEmail({
          to:        email,
          clientName: client.full_name ?? 'Cliente',
          planName:   plan?.name ?? 'Plano',
          expiresAt,
        }).catch(() => {})
      }
    }

    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function grantManualSubscription(
  clientId: string,
  planId: string,
  period: BillingPeriod
): Promise<ActionResult> {
  if (!idSchema.safeParse(clientId).success) return { success: false, error: 'ID de cliente inválido' }
  if (!idSchema.safeParse(planId).success)   return { success: false, error: 'ID de plano inválido' }
  if (!isValidBillingPeriod(period))         return { success: false, error: 'Duração inválida' }

  try {
    const { userId, supabase } = await requireAdmin()

    const rl = await checkRateLimit('adminGrantSub', userId, RATE_LIMITS.adminAction)
    if (!rl.success) throw new DomainError('Muitas ações seguidas. Aguarde 1 minuto.')

    // Valida que o destinatário REALMENTE é cliente (não barber/admin).
    // Antes, admin podia digitar UUID de outro role — INSERT passava na FK
    // de profiles e barber/admin acabava com subscription ativa.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', clientId)
      .maybeSingle()

    if (!profile) throw new DomainError('Cliente não encontrado.')
    if (profile.role !== 'client') throw new DomainError('Este usuário não é cliente.')
    if (!profile.is_active) throw new DomainError('Cliente está inativo.')

    const now = new Date()
    const expiresAt = calculateExpiry(now, period)

    const { error } = await subscriptionsRepo.create(supabase, {
      client_id:     clientId,
      plan_id:       planId,
      status:        'active',
      started_at:    now.toISOString(),
      expires_at:    expiresAt.toISOString(),
      auto_renew:    false,
      payment_method: 'cash',
    })
    if (error) throw error

    revalidateClients(clientId)
    updateTag('admin-kpis')
    updateTag('admin-recent-subs')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}
