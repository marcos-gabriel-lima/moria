'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, updateTag } from 'next/cache'
import { addMonths } from 'date-fns'
import type { ActionResult, Subscription } from '@/types'
import { z } from 'zod'

const subscribeSchema = z.object({
  plan_id: z.string().uuid(),
})

export async function subscribeToPlan(
  formData: z.infer<typeof subscribeSchema>
): Promise<ActionResult<Subscription>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = subscribeSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { plan_id } = parsed.data

  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('id', plan_id)
    .eq('is_active', true)
    .single()

  if (!plan) return { success: false, error: 'Plano não encontrado' }

  const now = new Date()
  const expiresAt = addMonths(now, 1)

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .insert({
      client_id: user.id,
      plan_id,
      status: 'active',
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      auto_renew: true,
    })
    .select('*, plan:plans(*)')
    .single()

  if (error) return { success: false, error: 'Erro ao criar assinatura' }

  revalidatePath('/plans')
  revalidatePath('/wallet')
  revalidatePath('/dashboard')
  updateTag('admin-kpis')
  updateTag('admin-recent-subs')

  return { success: true, data: subscription as Subscription }
}

export async function cancelSubscription(
  subscriptionId: string,
  reason?: string
): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(subscriptionId).success) {
    return { success: false, error: 'ID de assinatura inválido' }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('client_id, status')
    .eq('id', subscriptionId)
    .single()

  if (!sub) return { success: false, error: 'Assinatura não encontrada' }
  if (sub.client_id !== user.id) return { success: false, error: 'Sem permissão' }
  if (sub.status !== 'active') return { success: false, error: 'Assinatura não está ativa' }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason ?? 'Cancelado pelo cliente',
      auto_renew: false,
    })
    .eq('id', subscriptionId)

  if (error) return { success: false, error: 'Erro ao cancelar assinatura' }

  revalidatePath('/wallet')
  revalidatePath('/plans')
  updateTag('admin-kpis')
  updateTag('admin-recent-subs')

  return { success: true, data: undefined }
}

export async function getActiveSubscription(): Promise<ActionResult<Subscription | null>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('client_id', user.id)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error) return { success: false, error: 'Erro ao buscar assinatura' }

  return { success: true, data: data as Subscription | null }
}

export async function verifySubscriptionByQR(
  token: string
): Promise<ActionResult<{ isValid: boolean; subscription: Subscription | null; client: { name: string; plan: string } | null }>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['barber', 'admin'].includes(profile?.role ?? '')) {
    return { success: false, error: 'Sem permissão' }
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*), client:profiles(*)')
    .eq('qr_code_token', token)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!sub) {
    return {
      success: true,
      data: { isValid: false, subscription: null, client: null }
    }
  }

  return {
    success: true,
    data: {
      isValid: true,
      subscription: sub as unknown as Subscription,
      client: {
        name: (sub.client as { full_name: string }).full_name,
        plan: (sub.plan as { name: string }).name,
      }
    }
  }
}
