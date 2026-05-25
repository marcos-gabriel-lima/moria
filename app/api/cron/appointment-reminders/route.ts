import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendAppointmentReminderEmail } from '@/lib/email'
import { addDays, startOfDay, endOfDay } from 'date-fns'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const tomorrow  = addDays(new Date(), 1)
    const dayStart  = startOfDay(tomorrow).toISOString()
    const dayEnd    = endOfDay(tomorrow).toISOString()

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
    let sent = 0, failed = 0

    for (const apt of appointments ?? []) {
      const client = apt.client as any
      if (!client?.id) continue

      const { data: authUser } = await supabase.auth.admin.getUserById(client.id)
      const email = authUser?.user?.email
      if (!email) continue

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

    return NextResponse.json({ ok: true, sent, failed })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
