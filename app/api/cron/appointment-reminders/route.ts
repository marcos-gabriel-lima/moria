import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { sendAppointmentReminderEmail } from '@/lib/email'
import { dayRangeBR } from '@/lib/timezone-br'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Compara secrets em constant time pra evitar timing attacks.
 * Retorna false se os tamanhos diferirem (sem fazer timing leak).
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? ''
  const expected = process.env.CRON_SECRET ?? ''
  if (!expected || !constantTimeEqual(secret, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // CRITICO: precisa de service_role pra usar auth.admin.* abaixo.
    // O cliente anon (createClient) não tem permissão pra getUserById.
    const supabase = await createAdminClient()

    // "Amanhã BR" — antes usávamos UTC, deslocando 3h. Agendamentos das
    // últimas 3h do dia BR ficavam sem lembrete.
    const { start: dayStart, end: dayEnd } = dayRangeBR(new Date(), 1)

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        total_price,
        client:profiles!client_id(id, full_name),
        barber:barbers!barber_id(profile:profiles!id(full_name)),
        services:appointment_services(service:services(name))
      `)
      .gte('scheduled_at', dayStart)
      .lte('scheduled_at', dayEnd)
      .eq('status', 'scheduled')

    if (error) throw error

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    let sent = 0, failed = 0, skipped = 0

    for (const apt of appointments ?? []) {
      const client = apt.client as any
      if (!client?.id) { skipped++; continue }

      const { data: authUser } = await supabase.auth.admin.getUserById(client.id)
      const email = authUser?.user?.email
      if (!email) { skipped++; continue }

      const barber      = apt.barber      as any
      const services    = apt.services    as any[]
      const serviceName = services?.map((s: any) => s.service?.name).filter(Boolean).join(', ') || 'Serviço'
      const barberName  = barber?.profile?.full_name ?? 'Barbeiro'

      try {
        await sendAppointmentReminderEmail({
          to:          email,
          clientName:  client.full_name ?? 'Cliente',
          barberName,
          serviceName,
          scheduledAt: new Date(apt.scheduled_at),
          appUrl,
        })
        sent++
      } catch {
        failed++
      }
    }

    return NextResponse.json({ ok: true, sent, failed, skipped })
  } catch (e: unknown) {
    // Log pra debug, mas NÃO vaza message no response.
    console.error('[cron/appointment-reminders]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
