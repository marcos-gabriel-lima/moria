'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from './_guard'
import { clientsRepo } from '@/lib/repositories/clients'
import { subscriptionsRepo } from '@/lib/repositories/subscriptions'
import { sendSubscriptionActiveEmail } from '@/lib/email'
import { calculateExpiry, isValidBillingPeriod, ONE_MONTH, type BillingPeriod } from '@/lib/billing'
import { toActionError } from '@/lib/action-error'
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
  try {
    const { supabase } = await requireAdmin()
    const { error } = await subscriptionsRepo.cancel(supabase, subscriptionId, reason)
    if (error) throw error
    revalidateClients()
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
    const { supabase } = await requireAdmin()
    const now = new Date()
    const expiresAt = calculateExpiry(now, period)

    const { data, error } = await subscriptionsRepo.activate(supabase, subscriptionId, {
      started_at:     now.toISOString(),
      expires_at:     expiresAt.toISOString(),
      payment_method: paymentMethod,
    })
    if (error || !data) throw error ?? new Error('Assinatura não encontrada ou já ativada')

    revalidatePath('/admin/subscriptions')
    revalidatePath(`/admin/clients/${data.client_id}`)
    updateTag('admin-kpis')
    updateTag('admin-recent-subs')

    const client = data.client as any
    const plan   = data.plan   as any
    if (client?.id) {
      const { data: authUser } = await supabase.auth.admin.getUserById(client.id)
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
    const { supabase } = await requireAdmin()
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
