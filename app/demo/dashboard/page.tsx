import Link from 'next/link'
import { Calendar, Crown, Clock, ChevronRight, Scissors, CheckCircle2 } from 'lucide-react'
import { SubscriberBadge } from '@/components/shared/subscriber-badge'
import { DEMO_USER, DEMO_SUBSCRIPTION, DEMO_APPOINTMENTS } from '@/lib/demo-data'
import { formatDate } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const metadata = { title: 'Demo — Início' }

export default function DemoDashboardPage() {
  const firstName = DEMO_USER.full_name.split(' ')[0]
  const plan = DEMO_SUBSCRIPTION.plan
  const upcomingApts = DEMO_APPOINTMENTS.filter(a => ['scheduled', 'confirmed'].includes(a.status))
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 3)

  return (
    <div className="space-y-6 max-w-2xl mx-auto lg:mx-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Olá,</p>
          <h1 className="text-2xl font-black">{firstName} 👋</h1>
        </div>
        <SubscriberBadge planName={plan.name} />
      </div>

      {/* Banner plano ativo */}
      <Link href="/demo/wallet">
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

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/demo/appointments"
          className="flex flex-col gap-3 p-4 rounded-xl bg-moria-surface border border-moria-border hover:border-gold-DEFAULT/40 transition-all"
        >
          <Calendar className="w-6 h-6 text-gold-DEFAULT" />
          <div>
            <p className="font-semibold text-sm">Novo Agendamento</p>
            <p className="text-xs text-muted-foreground">Marque seu horário</p>
          </div>
        </Link>

        <Link
          href="/demo/appointments"
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Próximos agendamentos</h2>
          <Link href="/demo/appointments" className="text-xs text-gold-DEFAULT hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="space-y-3">
          {upcomingApts.map(apt => {
            const barberName = (apt.barber as any)?.profile?.full_name ?? 'Barbeiro'
            const serviceName = apt.services[0]?.service?.name ?? 'Serviço'
            const isConfirmed = apt.status === 'confirmed'
            return (
              <div
                key={apt.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-moria-surface border border-gold-DEFAULT/30 hover:border-gold-DEFAULT/50 transition-colors"
              >
                <div className="text-center shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(apt.scheduled_at), "dd MMM", { locale: ptBR })}
                  </p>
                  <p className="text-sm font-black text-gold-DEFAULT">
                    {format(new Date(apt.scheduled_at), "HH:mm")}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{serviceName}</p>
                  <p className="text-xs text-muted-foreground">{barberName}</p>
                </div>
                <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                  isConfirmed
                    ? 'text-green-400 bg-green-950/40 border-green-800/30'
                    : 'text-blue-400 bg-blue-950/40 border-blue-800/30'
                }`}>
                  {isConfirmed && <CheckCircle2 className="w-3 h-3" />}
                  {isConfirmed ? 'Confirmado' : 'Agendado'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
