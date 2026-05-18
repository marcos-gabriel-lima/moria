import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Crown, Clock, ChevronRight, Scissors, AlertCircle } from 'lucide-react'
import { createClient, getUser } from '@/lib/supabase/server'
import { SubscriberBadge } from '@/components/shared/subscriber-badge'
import { AppointmentCard } from '@/components/appointments/appointment-card'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Início' }

export default async function DashboardPage() {
  const user = await getUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  const [{ data: profile }, { data: subscription }, { data: upcomingApts }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('client_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle(),
    supabase
      .from('appointments')
      .select('*, barber:barbers(*, profile:profiles(*)), services:appointment_services(*, service:services(*))')
      .eq('client_id', user.id)
      .in('status', ['scheduled', 'confirmed'])
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(3),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Cliente'
  const plan = subscription?.plan as { name: string; includes_cut: boolean; includes_beard: boolean } | null

  return (
    <div className="space-y-6 max-w-2xl mx-auto lg:mx-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Olá,</p>
          <h1 className="text-2xl font-black">{firstName} 👋</h1>
        </div>
        {subscription && plan && (
          <SubscriberBadge planName={plan.name} />
        )}
      </div>

      {/* Banner do plano ou CTA */}
      {subscription && plan ? (
        <Link href="/wallet">
          <div className="relative overflow-hidden rounded-xl border border-gold-DEFAULT/40 bg-gradient-to-r from-moria-surface to-black p-5 hover:border-gold-DEFAULT/60 transition-all group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-DEFAULT/5 rounded-full blur-2xl" />
            <div className="relative flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-gold-DEFAULT font-semibold uppercase tracking-wider">Plano Ativo</p>
                <p className="font-bold text-lg">{plan.name}</p>
                <div className="flex gap-2 mt-2">
                  {plan.includes_cut && (
                    <span className="text-xs bg-gold-DEFAULT/10 text-gold-DEFAULT border border-gold-DEFAULT/20 px-2 py-0.5 rounded-full">
                      ✂ Corte
                    </span>
                  )}
                  {plan.includes_beard && (
                    <span className="text-xs bg-gold-DEFAULT/10 text-gold-DEFAULT border border-gold-DEFAULT/20 px-2 py-0.5 rounded-full">
                      ⚡ Barba
                    </span>
                  )}
                </div>
              </div>
              <Crown className="w-10 h-10 text-gold-DEFAULT/60 group-hover:text-gold-DEFAULT transition-colors" />
            </div>
          </div>
        </Link>
      ) : (
        <Link href="/plans">
          <div className="rounded-xl border border-dashed border-moria-border p-5 hover:border-gold-DEFAULT/40 transition-all group">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-semibold">Assine um plano</p>
                <p className="text-sm text-muted-foreground">
                  Cortes ilimitados + prioridade de agendamento
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-gold-DEFAULT transition-colors" />
            </div>
          </div>
        </Link>
      )}

      {/* Aviso 48h para não-assinantes */}
      {!subscription && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-950/20 border border-amber-800/30 text-amber-400/80 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Sem assinatura, você pode agendar com até <strong>48h</strong> de antecedência.
          </p>
        </div>
      )}

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/appointments/new"
          className="flex flex-col gap-3 p-4 rounded-xl bg-moria-surface border border-moria-border hover:border-gold-DEFAULT/40 transition-all"
        >
          <Calendar className="w-6 h-6 text-gold-DEFAULT" />
          <div>
            <p className="font-semibold text-sm">Novo Agendamento</p>
            <p className="text-xs text-muted-foreground">Marque seu horário</p>
          </div>
        </Link>

        <Link
          href="/appointments"
          className="flex flex-col gap-3 p-4 rounded-xl bg-moria-surface border border-moria-border hover:border-gold-DEFAULT/40 transition-all"
        >
          <Clock className="w-6 h-6 text-gold-DEFAULT" />
          <div>
            <p className="font-semibold text-sm">Meus Agendamentos</p>
            <p className="text-xs text-muted-foreground">Ver histórico</p>
          </div>
        </Link>
      </div>

      {/* Próximos agendamentos */}
      {upcomingApts && upcomingApts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Próximos agendamentos</h2>
            <Link href="/appointments" className="text-xs text-gold-DEFAULT hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingApts.map(apt => (
              <AppointmentCard
                key={apt.id}
                appointment={apt as any}
                showBarber
              />
            ))}
          </div>
        </div>
      )}

      {!upcomingApts?.length && (
        <div className="text-center py-10 space-y-3">
          <Scissors className="w-10 h-10 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground text-sm">Nenhum agendamento próximo</p>
          <Link
            href="/appointments/new"
            className="inline-flex items-center gap-2 text-sm text-gold-DEFAULT hover:underline"
          >
            Agendar agora
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
