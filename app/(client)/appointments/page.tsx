import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AppointmentCard } from '@/components/appointments/appointment-card'
import type { Appointment } from '@/types'

export const metadata = { title: 'Agendamentos' }

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase
      .from('appointments')
      .select('*, barber:barbers(id, profile:profiles(full_name)), services:appointment_services(*, service:services(*)), subscription:subscriptions(*, plan:plans(*))')
      .eq('client_id', user.id)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true }),

    supabase
      .from('appointments')
      .select('*, barber:barbers(id, profile:profiles(full_name)), services:appointment_services(*, service:services(*)), subscription:subscriptions(*, plan:plans(*))')
      .eq('client_id', user.id)
      .or('status.in.(completed,cancelled,no_show),scheduled_at.lt.' + new Date().toISOString())
      .order('scheduled_at', { ascending: false })
      .limit(20),
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Agendamentos</h1>
        <Link
          href="/appointments/new"
          className="flex items-center gap-2 bg-gold-gradient text-black font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Novo
        </Link>
      </div>

      {/* Sucesso */}
      {params.success && (
        <div className="p-3 rounded-lg bg-green-950/40 border border-green-800/40 text-green-400 text-sm text-center">
          ✓ Agendamento confirmado com sucesso!
        </div>
      )}

      {/* Próximos */}
      {upcoming && upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Próximos</h2>
          {upcoming.map(apt => (
            <AppointmentCard
              key={apt.id}
              appointment={apt as unknown as Appointment}
              showBarber
            />
          ))}
        </div>
      )}

      {/* Histórico */}
      {past && past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Histórico</h2>
          {past.map(apt => (
            <AppointmentCard
              key={apt.id}
              appointment={apt as unknown as Appointment}
              showBarber
            />
          ))}
        </div>
      )}

      {!upcoming?.length && !past?.length && (
        <div className="text-center py-16 space-y-4">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground">Nenhum agendamento ainda</p>
          <Link
            href="/appointments/new"
            className="inline-flex items-center gap-2 bg-gold-gradient text-black font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Agendar agora
          </Link>
        </div>
      )}
    </div>
  )
}
