'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, updateTag } from 'next/cache'
import { addMinutes } from 'date-fns'
import type { ActionResult, Appointment } from '@/types'
import { z } from 'zod'
import { sendAppointmentConfirmedEmail } from '@/lib/email'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const createAppointmentSchema = z.object({
  barber_id: z.string().uuid(),
  service_ids: z.array(z.string().uuid()).min(1, 'Selecione ao menos 1 serviço').max(10, 'Máximo de 10 serviços por agendamento'),
  scheduled_at: z.string().datetime().refine(
    s => new Date(s).getTime() > Date.now(),
    'Não é possível agendar horários no passado'
  ),
  notes: z.string().max(500).optional(),
})

export async function createAppointment(
  formData: z.infer<typeof createAppointmentSchema>
): Promise<ActionResult<Appointment>> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Não autenticado' }
  }

  const rl = await checkRateLimit('createBooking', user.id, RATE_LIMITS.createBooking)
  if (!rl.success) return { success: false, error: 'Muitos agendamentos seguidos. Aguarde 1 minuto.' }

  const parsed = createAppointmentSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { barber_id, service_ids, scheduled_at, notes } = parsed.data

  // Valida barber_id: deve existir e estar ativo (não confie no front)
  const { data: barber } = await supabase
    .from('barbers')
    .select('id')
    .eq('id', barber_id)
    .eq('is_active', true)
    .maybeSingle()

  if (!barber) return { success: false, error: 'Barbeiro inválido ou indisponível' }

  // Deduplica service_ids (front pode enviar repetidos)
  const uniqueServiceIds = [...new Set(service_ids)]

  const [{ data: services, error: servicesError }, { data: subscription }] = await Promise.all([
    supabase.from('services').select('*').in('id', uniqueServiceIds).eq('is_active', true),
    supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('client_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle(),
  ])

  if (servicesError || !services?.length || services.length !== uniqueServiceIds.length) {
    return { success: false, error: 'Serviços inválidos' }
  }

  const totalDuration = services.reduce((sum, s) => sum + s.duration_minutes, 0)
  const totalPrice = services.reduce((sum, s) => sum + s.price, 0)

  // Calcular preço real considerando plano
  let actualPrice = 0
  const appointmentServices = services.map(service => {
    const coveredByPlan = subscription
      ? (service.covered_by_cut && subscription.plan?.includes_cut) ||
        (service.covered_by_beard && subscription.plan?.includes_beard)
      : false

    if (!coveredByPlan) actualPrice += service.price

    return {
      service_id: service.id,
      price: service.price,
      covered_by_plan: coveredByPlan,
    }
  })

  // Criar agendamento (trigger no BD valida regra das 48h)
  const { data: appointment, error: aptError } = await supabase
    .from('appointments')
    .insert({
      client_id: user.id,
      barber_id,
      subscription_id: subscription?.id ?? null,
      scheduled_at,
      duration_minutes: totalDuration,
      notes: notes ?? null,
      total_price: actualPrice,
    })
    .select()
    .single()

  if (aptError) {
    // Erros do trigger de validação
    if (aptError.message.includes('BOOKING_TOO_FAR_AHEAD')) {
      return {
        success: false,
        error: 'Não-assinantes só podem agendar com até 48h de antecedência. Assine um plano para agendar com mais antecedência.',
      }
    }
    if (aptError.message.includes('SLOT_CONFLICT')) {
      return { success: false, error: 'Este horário já está ocupado. Escolha outro horário.' }
    }
    if (aptError.message.includes('SLOT_BLOCKED')) {
      return { success: false, error: 'Este horário está bloqueado pelo barbeiro.' }
    }
    return { success: false, error: 'Erro ao criar agendamento. Tente novamente.' }
  }

  // Inserir serviços do agendamento
  const { error: svcError } = await supabase
    .from('appointment_services')
    .insert(
      appointmentServices.map(s => ({ ...s, appointment_id: appointment.id }))
    )

  if (svcError) {
    // Rollback: cancelar o agendamento criado
    await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointment.id)
    return { success: false, error: 'Erro ao salvar serviços do agendamento.' }
  }

  revalidatePath('/appointments')
  revalidatePath('/barber/schedule')
  revalidatePath('/admin/dashboard')
  updateTag('admin-kpis')

  // Envia email de confirmação (fire-and-forget — não bloqueia a resposta)
  const { data: authUser } = await supabase.auth.getUser()
  if (authUser?.user?.email) {
    const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const barberName = (await supabase.from('profiles').select('full_name').eq('id', barber_id).single()).data?.full_name ?? 'Barbeiro'
    sendAppointmentConfirmedEmail({
      to:          authUser.user.email,
      clientName:  authUser.user.user_metadata?.full_name ?? 'Cliente',
      barberName,
      serviceName: services.map(s => s.name).join(', '),
      scheduledAt: new Date(scheduled_at),
      totalPrice:  actualPrice,
      appUrl,
    }).catch(() => {})
  }

  return { success: true, data: appointment as Appointment }
}

export async function cancelAppointment(
  appointmentId: string,
  reason?: string
): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(appointmentId).success) {
    return { success: false, error: 'ID de agendamento inválido' }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const [{ data: apt }, { data: profile }] = await Promise.all([
    supabase.from('appointments').select('client_id, status, scheduled_at').eq('id', appointmentId).single(),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  if (!apt) return { success: false, error: 'Agendamento não encontrado' }

  if (apt.client_id !== user.id && profile?.role !== 'admin') {
    return { success: false, error: 'Sem permissão para cancelar este agendamento' }
  }

  if (['completed', 'cancelled'].includes(apt.status)) {
    return { success: false, error: 'Este agendamento não pode ser cancelado' }
  }

  const { data: cancelResult, error } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason ?? null,
    })
    .eq('id', appointmentId)
    .not('status', 'in', '("completed","cancelled")')
    .select('id')
    .maybeSingle()

  if (error) return { success: false, error: 'Erro ao cancelar agendamento' }
  if (!cancelResult) return { success: false, error: 'Agendamento não pode ser cancelado' }

  revalidatePath('/appointments')
  revalidatePath('/barber/schedule')
  updateTag('admin-kpis')

  return { success: true, data: undefined }
}

export async function completeAppointment(
  appointmentId: string
): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(appointmentId).success) {
    return { success: false, error: 'ID de agendamento inválido' }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  // Valida status atual antes de completar (não confie no front)
  const { data, error } = await supabase
    .from('appointments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)
    .eq('barber_id', user.id)
    .in('status', ['scheduled', 'confirmed', 'in_progress'])
    .select('id')
    .single()

  if (error || !data) return { success: false, error: 'Agendamento não encontrado, sem permissão ou status inválido' }

  revalidatePath('/barber/schedule')
  revalidatePath('/admin/dashboard')
  updateTag('admin-kpis')
  updateTag('admin-reports')

  return { success: true, data: undefined }
}

export async function getAvailableSlots(
  barberId: string,
  date: string
): Promise<ActionResult<{ slots: string[]; blocked: { starts_at: string; ends_at: string }[] }>> {
  if (!z.string().uuid().safeParse(barberId).success) {
    return { success: false, error: 'Barbeiro inválido' }
  }
  if (!z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(date).success) {
    return { success: false, error: 'Data inválida' }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const rl = await checkRateLimit('availableSlots', user.id, RATE_LIMITS.availableSlots)
  if (!rl.success) return { success: false, error: 'Muitas consultas. Aguarde 1 minuto.' }

  const dayStart = `${date}T00:00:00`
  const dayEnd = `${date}T23:59:59`

  const [{ data: appointments }, { data: blocked }] = await Promise.all([
    supabase
      .from('appointments')
      .select('scheduled_at, duration_minutes, status')
      .eq('barber_id', barberId)
      .gte('scheduled_at', dayStart)
      .lte('scheduled_at', dayEnd)
      .not('status', 'in', '("cancelled","no_show")'),

    supabase
      .from('blocked_slots')
      .select('starts_at, ends_at')
      .eq('barber_id', barberId)
      .lte('starts_at', dayEnd)
      .gte('ends_at', dayStart),
  ])

  return {
    success: true,
    data: {
      slots: (appointments ?? []).map(a => a.scheduled_at),
      blocked: (blocked ?? []).map(b => ({ starts_at: b.starts_at, ends_at: b.ends_at })),
    },
  }
}
