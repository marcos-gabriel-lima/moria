import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient, getUser } from '@/lib/supabase/server'
import { BarberScheduleView } from '@/components/barber/barber-schedule-view'
import { blockedSlotsRepo } from '@/lib/repositories/blocked-slots'

export const metadata = { title: 'Minha Agenda' }

export default async function BarberSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const user = await getUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  const params  = await searchParams
  const dateStr = params.date ?? format(new Date(), 'yyyy-MM-dd')
  const dayStart = `${dateStr}T00:00:00.000Z`
  const dayEnd   = `${dateStr}T23:59:59.999Z`

  const [{ data: profile }, { data: appointments }, { data: blockedSlots }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase
      .from('appointments')
      .select(`
        *,
        client:profiles(*),
        services:appointment_services(*, service:services(*)),
        subscription:subscriptions(*, plan:plans(*))
      `)
      .eq('barber_id', user.id)
      .gte('scheduled_at', dayStart)
      .lte('scheduled_at', dayEnd)
      .not('status', 'in', '("cancelled","no_show")')
      .order('scheduled_at', { ascending: true }),
    blockedSlotsRepo.findByBarberAndDay(supabase, user.id, dayStart, dayEnd),
  ])

  if (!['barber', 'admin'].includes(profile?.role ?? '')) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Minha Agenda</h1>
        <p className="text-sm text-muted-foreground mt-1 capitalize">
          {format(new Date(dateStr + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      <BarberScheduleView
        appointments={(appointments ?? []) as any}
        blockedSlots={(blockedSlots ?? []) as any}
        currentDate={dateStr}
        barberId={user.id}
      />
    </div>
  )
}
