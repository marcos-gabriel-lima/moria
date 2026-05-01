import { redirect } from 'next/navigation'
import Link from 'next/link'
import { startOfMonth, endOfMonth, startOfToday, subMonths, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, Users, Calendar, Crown, Scissors, ChevronRight, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/admin/stats-card'
import { cn, formatCurrency, getWhatsAppUrl, getAppointmentStatusLabel, getAppointmentStatusColor } from '@/lib/utils'

export const metadata = { title: 'Dashboard' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const monthStart  = startOfMonth(now).toISOString()
  const monthEnd    = endOfMonth(now).toISOString()
  const prevStart   = startOfMonth(subMonths(now, 1)).toISOString()
  const prevEnd     = endOfMonth(subMonths(now, 1)).toISOString()
  const todayStr    = format(startOfToday(), 'yyyy-MM-dd')
  const todayStart  = `${todayStr}T00:00:00.000Z`
  const todayEnd    = `${todayStr}T23:59:59.999Z`

  const [
    { count: totalClients },
    { count: activeSubscriptions },
    { count: todayApts },
    { count: monthApts },
    { count: monthCompleted },
    { data: monthPayments },
    { data: prevPayments },
    { data: todaySchedule },
    { data: recentSubscriptions },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client').eq('is_active', true),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active').gt('expires_at', now.toISOString()),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('scheduled_at', todayStart).lte('scheduled_at', todayEnd).not('status', 'in', '("cancelled","no_show")'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('scheduled_at', monthStart).lte('scheduled_at', monthEnd).not('status', 'in', '("cancelled","no_show")'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('scheduled_at', monthStart).lte('scheduled_at', monthEnd),
    supabase.from('payments').select('amount').eq('status', 'paid').gte('paid_at', monthStart).lte('paid_at', monthEnd),
    supabase.from('payments').select('amount').eq('status', 'paid').gte('paid_at', prevStart).lte('paid_at', prevEnd),
    supabase
      .from('appointments')
      .select('id, scheduled_at, status, is_subscriber, total_price, client:profiles(full_name, whatsapp, phone), barber:barbers(profile:profiles(full_name)), services:appointment_services(service:services(name))')
      .gte('scheduled_at', todayStart)
      .lte('scheduled_at', todayEnd)
      .not('status', 'in', '("cancelled","no_show")')
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('subscriptions')
      .select('id, status, created_at, client:profiles(full_name, whatsapp), plan:plans(name, price)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const monthRevenue = (monthPayments ?? []).reduce((s, p) => s + p.amount, 0)
  const prevRevenue  = (prevPayments  ?? []).reduce((s, p) => s + p.amount, 0)
  const revTrend     = prevRevenue > 0 ? Math.round(((monthRevenue - prevRevenue) / prevRevenue) * 100) : 0
  const completionRate = (monthApts ?? 0) > 0
    ? Math.round(((monthCompleted ?? 0) / (monthApts ?? 1)) * 100)
    : 0

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
        <Link
          href="/admin/reports"
          className="flex items-center gap-2 text-sm text-gold-DEFAULT hover:underline"
        >
          Ver relatórios completos
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          label="Receita do Mês"
          value={formatCurrency(monthRevenue)}
          icon={TrendingUp}
          accent="gold"
          trend={prevRevenue > 0 ? { value: revTrend, label: 'vs mês ant.' } : undefined}
        />
        <StatsCard
          label="Assinaturas Ativas"
          value={activeSubscriptions ?? 0}
          icon={Crown}
          accent="gold"
          sub="Planos recorrentes"
        />
        <StatsCard
          label="Agendamentos Hoje"
          value={todayApts ?? 0}
          icon={Calendar}
          accent="blue"
          sub={`${monthApts ?? 0} no mês`}
        />
        <StatsCard
          label="Taxa de Conclusão"
          value={`${completionRate}%`}
          icon={Scissors}
          accent="purple"
          sub={`${monthCompleted ?? 0} de ${monthApts ?? 0} no mês`}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Agenda de hoje */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Agenda de Hoje</h2>
            <span className="text-xs text-muted-foreground">{todayApts} agendamentos</span>
          </div>

          {!todaySchedule?.length ? (
            <div className="flex items-center justify-center py-12 rounded-xl bg-moria-surface border border-moria-border">
              <p className="text-muted-foreground text-sm">Nenhum agendamento hoje</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todaySchedule.map(apt => {
                const client  = apt.client  as any
                const barber  = apt.barber  as any
                const services = apt.services as any[]
                const phone = client?.whatsapp ?? client?.phone

                return (
                  <div
                    key={apt.id}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl bg-moria-surface border transition-colors',
                      (apt as any).is_subscriber
                        ? 'border-gold-DEFAULT/30 hover:border-gold-DEFAULT/50'
                        : 'border-moria-border hover:border-moria-border/80'
                    )}
                  >
                    {/* Hora */}
                    <div className="text-sm font-black text-gold-DEFAULT w-12 shrink-0">
                      {format(new Date(apt.scheduled_at), 'HH:mm')}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{client?.full_name}</p>
                        {(apt as any).is_subscriber && (
                          <span className="text-[10px] text-gold-DEFAULT bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 px-1.5 py-0.5 rounded-full font-semibold">
                            ✦ Assinante
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {barber?.profile?.full_name} · {services?.map((s: any) => s.service?.name).join(', ')}
                      </p>
                    </div>

                    {/* Status + WA */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', getAppointmentStatusColor(apt.status))}>
                        {getAppointmentStatusLabel(apt.status)}
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
          )}
        </div>

        {/* Últimas assinaturas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Novas Assinaturas</h2>
            <Link href="/admin/clients?filter=subscribers" className="text-xs text-gold-DEFAULT hover:underline">
              Ver todas
            </Link>
          </div>

          <div className="space-y-2">
            {recentSubscriptions?.map(sub => {
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
            {!recentSubscriptions?.length && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhuma assinatura recente
              </p>
            )}
          </div>

          {/* Atalhos */}
          <div className="space-y-2 pt-2 border-t border-moria-border">
            {[
              { href: '/admin/clients',  label: 'Gerenciar clientes', count: totalClients ?? 0 },
              { href: '/admin/barbers',  label: 'Gerenciar barbeiros' },
              { href: '/admin/plans',    label: 'Gerenciar planos'    },
            ].map(({ href, label, count }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between p-3 rounded-lg border border-moria-border bg-moria-elevated hover:border-gold-DEFAULT/30 transition-colors text-sm"
              >
                <span className="text-muted-foreground">{label}</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  {count !== undefined && <span className="text-xs">{count}</span>}
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
