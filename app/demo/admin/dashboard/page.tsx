import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, Users, Calendar, Crown, Scissors, ChevronRight, MessageCircle } from 'lucide-react'
import { StatsCard } from '@/components/admin/stats-card'
import { cn, formatCurrency, getWhatsAppUrl, getAppointmentStatusLabel, getAppointmentStatusColor } from '@/lib/utils'
import {
  DEMO_ADMIN,
  DEMO_TODAY_SCHEDULE,
  DEMO_RECENT_SUBSCRIPTIONS,
} from '@/lib/demo-data'

export const metadata = { title: 'Demo — Admin' }

export default function DemoAdminDashboardPage() {
  const now = new Date()
  const {
    monthRevenue, prevRevenue, revTrend,
    activeSubscriptions, todayApts, monthApts,
    monthCompleted, completionRate, totalClients,
  } = DEMO_ADMIN

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">
            {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <span className="text-xs text-crimson-light bg-crimson/10 border border-crimson/20 px-3 py-1 rounded-full font-semibold uppercase tracking-widest">
          Painel Admin
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          label="Receita do Mês"
          value={formatCurrency(monthRevenue)}
          icon={TrendingUp}
          accent="gold"
          trend={{ value: revTrend, label: 'vs mês ant.' }}
        />
        <StatsCard
          label="Assinaturas Ativas"
          value={activeSubscriptions}
          icon={Crown}
          accent="gold"
          sub="Planos recorrentes"
        />
        <StatsCard
          label="Agendamentos Hoje"
          value={todayApts}
          icon={Calendar}
          accent="blue"
          sub={`${monthApts} no mês`}
        />
        <StatsCard
          label="Taxa de Conclusão"
          value={`${completionRate}%`}
          icon={Scissors}
          accent="purple"
          sub={`${monthCompleted} de ${monthApts} no mês`}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Agenda de hoje */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Agenda de Hoje</h2>
            <span className="text-xs text-muted-foreground">{todayApts} agendamentos</span>
          </div>

          <div className="space-y-2">
            {DEMO_TODAY_SCHEDULE.map(apt => {
              const client = apt.client as any
              const barber = apt.barber as any
              const services = apt.services as any[]
              const phone = client?.whatsapp

              return (
                <div
                  key={apt.id}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl bg-moria-surface border transition-colors',
                    apt.is_subscriber
                      ? 'border-gold-DEFAULT/30 hover:border-gold-DEFAULT/50'
                      : 'border-moria-border hover:border-moria-border/80'
                  )}
                >
                  <div className="text-sm font-black text-gold-DEFAULT w-12 shrink-0">
                    {format(new Date(apt.scheduled_at), 'HH:mm')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{client?.full_name}</p>
                      {apt.is_subscriber && (
                        <span className="text-[10px] text-gold-DEFAULT bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 px-1.5 py-0.5 rounded-full font-semibold">
                          ✦ Assinante
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {barber?.profile?.full_name} · {services?.map((s: any) => s.service?.name).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', getAppointmentStatusColor(apt.status as any))}>
                      {getAppointmentStatusLabel(apt.status as any)}
                    </span>
                    {phone && (
                      <a
                        href={getWhatsAppUrl(phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md text-green-400 hover:bg-green-950/30 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Últimas assinaturas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Novas Assinaturas</h2>
          </div>

          <div className="space-y-2">
            {DEMO_RECENT_SUBSCRIPTIONS.map(sub => {
              const client = sub.client as any
              const plan   = sub.plan   as any
              return (
                <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl bg-moria-surface border border-gold-DEFAULT/20">
                  <div className="w-8 h-8 rounded-full bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 flex items-center justify-center shrink-0">
                    <Crown className="w-4 h-4 text-gold-DEFAULT" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{client?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{plan?.name}</p>
                  </div>
                  <p className="text-xs font-bold text-gold-DEFAULT shrink-0">
                    {formatCurrency(plan?.price ?? 0)}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Atalhos */}
          <div className="space-y-2 pt-2 border-t border-moria-border">
            {[
              { href: '/demo/dashboard', label: 'Ver área do cliente', count: undefined },
              { href: '/demo/wallet',    label: 'Ver carteira digital', count: undefined },
              { href: '/demo/appointments', label: 'Ver agendamentos',  count: undefined },
            ].map(({ href, label, count }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between p-3 rounded-lg border border-moria-border bg-moria-elevated hover:border-gold-DEFAULT/30 transition-colors text-sm"
              >
                <span className="text-muted-foreground">{label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
