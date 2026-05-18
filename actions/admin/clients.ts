'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { requireAdmin } from './_guard'
import { clientsRepo } from '@/lib/repositories/clients'
import { subscriptionsRepo } from '@/lib/repositories/subscriptions'
import type { ActionResult } from '@/types'

function revalidateClients(id?: string) {
  revalidatePath('/admin/clients')
  if (id) revalidatePath(`/admin/clients/${id}`)
  updateTag('admin-clients')
}

export async function toggleClientActive(clientId: string, isActive: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await clientsRepo.setActive(supabase, clientId, isActive)
    if (error) throw error
    revalidateClients()
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updateClientNotes(clientId: string, notes: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await clientsRepo.updateNotes(supabase, clientId, notes)
    if (error) throw error
    revalidateClients(clientId)
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function cancelClientSubscription(
  subscriptionId: string,
  reason: string
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await subscriptionsRepo.cancel(supabase, subscriptionId, reason)
    if (error) throw error
    revalidateClients()
    updateTag('admin-kpis')
    updateTag('admin-recent-subs')
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function grantManualSubscription(
  clientId: string,
  planId: string,
  daysFromNow: number
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + daysFromNow * 86_400_000)

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
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
