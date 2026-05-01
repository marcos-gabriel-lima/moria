'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import { z } from 'zod'

// ── Guard: só admin executa estas actions ──────────────────────
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Sem permissão')
  return { supabase, userId: user.id }
}

// ═══════════════════════════════════════════════════════════════
// CLIENTES
// ═══════════════════════════════════════════════════════════════

export async function toggleClientActive(
  clientId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', clientId)
      .eq('role', 'client')
    if (error) throw error
    revalidatePath('/admin/clients')
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updateClientNotes(
  clientId: string,
  notes: string
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from('profiles')
      .update({ notes })
      .eq('id', clientId)
    if (error) throw error
    revalidatePath(`/admin/clients/${clientId}`)
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
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason,
        auto_renew: false,
      })
      .eq('id', subscriptionId)
    if (error) throw error
    revalidatePath('/admin/clients')
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
    const expiresAt = new Date(now.getTime() + daysFromNow * 86400000)

    const { error } = await supabase.from('subscriptions').insert({
      client_id: clientId,
      plan_id: planId,
      status: 'active',
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      payment_method: 'cash',
    })
    if (error) throw error
    revalidatePath('/admin/clients')
    revalidatePath(`/admin/clients/${clientId}`)
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ═══════════════════════════════════════════════════════════════
// BARBEIROS
// ═══════════════════════════════════════════════════════════════

const barberSchema = z.object({
  full_name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  specialty: z.array(z.string()).default([]),
  bio: z.string().optional(),
  instagram: z.string().optional(),
  commission_rate: z.coerce.number().min(0).max(100).default(50),
  works_monday: z.boolean().default(true),
  works_tuesday: z.boolean().default(true),
  works_wednesday: z.boolean().default(true),
  works_thursday: z.boolean().default(true),
  works_friday: z.boolean().default(true),
  works_saturday: z.boolean().default(true),
  works_sunday: z.boolean().default(false),
  start_time: z.string().default('08:00'),
  end_time: z.string().default('18:00'),
})

export async function createBarber(
  formData: z.infer<typeof barberSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()
    const parsed = barberSchema.parse(formData)

    // Criar usuário no Supabase Auth via admin client
    const adminSupabase = await createAdminClient()
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'

    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: parsed.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.full_name,
        phone: parsed.phone,
        whatsapp: parsed.whatsapp,
      },
    })
    if (authError) throw authError

    const userId = authData.user.id

    // Atualizar role para barber
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .update({
        role: 'barber',
        phone: parsed.phone ?? null,
        whatsapp: parsed.whatsapp ?? null,
      })
      .eq('id', userId)
    if (profileError) throw profileError

    // Criar registro na tabela barbers
    const { error: barberError } = await adminSupabase.from('barbers').insert({
      id: userId,
      specialty: parsed.specialty,
      bio: parsed.bio ?? null,
      instagram: parsed.instagram ?? null,
      commission_rate: parsed.commission_rate,
      works_monday: parsed.works_monday,
      works_tuesday: parsed.works_tuesday,
      works_wednesday: parsed.works_wednesday,
      works_thursday: parsed.works_thursday,
      works_friday: parsed.works_friday,
      works_saturday: parsed.works_saturday,
      works_sunday: parsed.works_sunday,
      start_time: parsed.start_time,
      end_time: parsed.end_time,
    })
    if (barberError) throw barberError

    revalidatePath('/admin/barbers')
    return { success: true, data: { id: userId } }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

const updateBarberSchema = barberSchema.omit({ email: true, full_name: true }).extend({
  id: z.string().uuid(),
  full_name: z.string().min(3).optional(),
})

export async function updateBarber(
  formData: z.infer<typeof updateBarberSchema>
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { id, full_name, ...barberData } = formData

    const { error } = await supabase.from('barbers').update({
      specialty: barberData.specialty,
      bio: barberData.bio ?? null,
      instagram: barberData.instagram ?? null,
      commission_rate: barberData.commission_rate,
      works_monday: barberData.works_monday,
      works_tuesday: barberData.works_tuesday,
      works_wednesday: barberData.works_wednesday,
      works_thursday: barberData.works_thursday,
      works_friday: barberData.works_friday,
      works_saturday: barberData.works_saturday,
      works_sunday: barberData.works_sunday,
      start_time: barberData.start_time,
      end_time: barberData.end_time,
    }).eq('id', id)

    if (error) throw error
    if (full_name) {
      await supabase.from('profiles').update({ full_name }).eq('id', id)
    }

    revalidatePath('/admin/barbers')
    revalidatePath(`/admin/barbers/${id}`)
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function toggleBarberActive(
  barberId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from('barbers')
      .update({ is_active: isActive })
      .eq('id', barberId)
    if (error) throw error
    revalidatePath('/admin/barbers')
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updateBarberCommission(
  barberId: string,
  rate: number
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from('barbers')
      .update({ commission_rate: rate })
      .eq('id', barberId)
    if (error) throw error
    revalidatePath(`/admin/barbers/${barberId}`)
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ═══════════════════════════════════════════════════════════════
// PLANOS
// ═══════════════════════════════════════════════════════════════

const planSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug: apenas letras minúsculas, números e hífens'),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  includes_cut: z.boolean().default(false),
  includes_beard: z.boolean().default(false),
  features: z.array(z.string()).default([]),
  display_order: z.coerce.number().default(0),
})

export async function createPlan(
  formData: z.infer<typeof planSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await requireAdmin()
    const parsed = planSchema.parse(formData)
    const { data, error } = await supabase
      .from('plans')
      .insert({ ...parsed, is_active: true })
      .select('id')
      .single()
    if (error) throw error
    revalidatePath('/admin/plans')
    revalidatePath('/plans')
    return { success: true, data: { id: data.id } }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updatePlan(
  id: string,
  formData: Partial<z.infer<typeof planSchema>>
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from('plans')
      .update(formData)
      .eq('id', id)
    if (error) throw error
    revalidatePath('/admin/plans')
    revalidatePath('/plans')
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function togglePlanActive(
  planId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from('plans')
      .update({ is_active: isActive })
      .eq('id', planId)
    if (error) throw error
    revalidatePath('/admin/plans')
    revalidatePath('/plans')
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ═══════════════════════════════════════════════════════════════
// SERVIÇOS
// ═══════════════════════════════════════════════════════════════

const serviceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.enum(['haircut', 'beard', 'combo', 'treatment', 'other']),
  duration_minutes: z.coerce.number().min(15).max(180),
  price: z.coerce.number().positive(),
  covered_by_cut: z.boolean().default(false),
  covered_by_beard: z.boolean().default(false),
  display_order: z.coerce.number().default(0),
})

export async function upsertService(
  formData: z.infer<typeof serviceSchema> & { id?: string }
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { id, ...data } = formData
    const parsed = serviceSchema.parse(data)

    const { error } = id
      ? await supabase.from('services').update(parsed).eq('id', id)
      : await supabase.from('services').insert({ ...parsed, is_active: true })

    if (error) throw error
    revalidatePath('/admin/plans')
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function toggleServiceActive(
  serviceId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from('services')
      .update({ is_active: isActive })
      .eq('id', serviceId)
    if (error) throw error
    revalidatePath('/admin/plans')
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ═══════════════════════════════════════════════════════════════
// RELATÓRIOS (queries)
// ═══════════════════════════════════════════════════════════════

export async function getReportsData(monthsBack = 6) {
  try {
    const { supabase } = await requireAdmin()
    const now = new Date()

    // Últimos N meses
    const months = Array.from({ length: monthsBack }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      return {
        label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString(),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString(),
      }
    }).reverse()

    const [
      { data: payments },
      { data: subscriptionsByPlan },
      { data: barberStats },
      { data: appointmentsByStatus },
    ] = await Promise.all([
      // Receita por mês
      supabase
        .from('payments')
        .select('amount, paid_at')
        .eq('status', 'paid')
        .gte('paid_at', months[0].start),

      // Assinaturas ativas por plano
      supabase
        .from('subscriptions')
        .select('plan_id, plan:plans(name), status')
        .eq('status', 'active')
        .gt('expires_at', now.toISOString()),

      // Performance por barbeiro (mês atual)
      supabase
        .from('appointments')
        .select('barber_id, status, total_price, barber:barbers(profile:profiles(full_name))')
        .gte('scheduled_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
        .lte('scheduled_at', new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()),

      // Agendamentos por status (mês atual)
      supabase
        .from('appointments')
        .select('status')
        .gte('scheduled_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
    ])

    // Agrupar receita por mês
    const revenueByMonth = months.map(m => {
      const total = (payments ?? [])
        .filter(p => p.paid_at && p.paid_at >= m.start && p.paid_at <= m.end)
        .reduce((sum, p) => sum + p.amount, 0)
      return { label: m.label, value: total }
    })

    // Assinaturas por plano
    const planMap: Record<string, { name: string; count: number }> = {}
    ;(subscriptionsByPlan ?? []).forEach((s: any) => {
      const id = s.plan_id
      if (!planMap[id]) planMap[id] = { name: s.plan?.name ?? id, count: 0 }
      planMap[id].count++
    })
    const subscriptionBreakdown = Object.values(planMap).sort((a, b) => b.count - a.count)

    // Performance por barbeiro
    const barberMap: Record<string, { name: string; completed: number; revenue: number; total: number }> = {}
    ;(barberStats ?? []).forEach((a: any) => {
      const id = a.barber_id
      const name = (a.barber as any)?.profile?.full_name ?? 'Barbeiro'
      if (!barberMap[id]) barberMap[id] = { name, completed: 0, revenue: 0, total: 0 }
      barberMap[id].total++
      if (a.status === 'completed') {
        barberMap[id].completed++
        barberMap[id].revenue += a.total_price ?? 0
      }
    })
    const barberRanking = Object.values(barberMap).sort((a, b) => b.revenue - a.revenue)

    // Breakdown por status
    const statusCount: Record<string, number> = {}
    ;(appointmentsByStatus ?? []).forEach(a => {
      statusCount[a.status] = (statusCount[a.status] ?? 0) + 1
    })
    const total = Object.values(statusCount).reduce((s, v) => s + v, 0)
    const completionRate = total > 0 ? Math.round(((statusCount.completed ?? 0) / total) * 100) : 0

    return {
      success: true,
      data: {
        revenueByMonth,
        subscriptionBreakdown,
        barberRanking,
        statusCount,
        completionRate,
        totalMonthRevenue: revenueByMonth[revenueByMonth.length - 1]?.value ?? 0,
        totalActiveSubscriptions: subscriptionsByPlan?.length ?? 0,
      },
    }
  } catch (e: any) {
    return { success: false, error: e.message, data: null }
  }
}
