import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewAppointmentForm } from '@/components/appointments/new-appointment-form'
import type { Barber, Service, Subscription } from '@/types'

export const metadata = { title: 'Novo Agendamento' }

export default async function NewAppointmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: barbers }, { data: services }, { data: subscription }] = await Promise.all([
    supabase
      .from('barbers')
      .select('*, profile:profiles(id, full_name, avatar_url)')
      .eq('is_active', true),
    supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('display_order'),
    supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('client_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle(),
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black">Novo Agendamento</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {subscription
            ? 'Como assinante, você pode agendar com qualquer antecedência ✨'
            : 'Agendamentos disponíveis com até 48h de antecedência'}
        </p>
      </div>

      <NewAppointmentForm
        barbers={(barbers ?? []) as unknown as (Barber & { profile: { id: string; full_name: string; avatar_url: string | null } })[]}
        services={(services ?? []) as Service[]}
        subscription={(subscription ?? null) as unknown as Subscription | null}
      />
    </div>
  )
}
