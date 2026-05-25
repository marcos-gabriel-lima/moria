import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { startOfToday, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, Crown, Calendar, Scissors, ChevronRight, MessageCircle } from 'lucide-react'
import { createClient, getUser } from '@/lib/supabase/server'
import { getAdminKPIs, getAdminRecentSubscriptions } from '@/lib/queries'
import { StatsCard } from '@/components/admin/stats-card'
import { cn, formatCurrency, getWhatsAppUrl, getAppointmentStatusLabel, getAppointmentStatusColor } from '@/lib/utils'

export const metadata = { title: 'Dashboard' }

// ── KPIs (cache 30s via unstable_cache) ──────────────────────────

async function DashboardKPIs() {
  const kpis = await getAdminKPIs()
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <StatsCard
        label="Receita do Mês"
        value={formatCurrency(kpis.monthRevenue)}
        icon={TrendingUp}
        accent="gold"
        trend={kpis.prevRevenue > 0 ? { value: kpis.revTrend, label: 'vs mês ant.' } : undefined}
      />
      <StatsCard
        label="Assinaturas Ativas"
        value={kpis.activeSubscriptions}
        icon={Crown}
        accent="gold"
        sub="Planos recorrentes"
      />
      <StatsCard
        label="Agendamentos/mês"
        value={kpis.monthApts}
        icon={Calendar}
        accent="blue"
        sub={`${kpis.monthCompleted} concluídos`}
      />
      <StatsCard
        label="Taxa de Conclusão"
        value={`${kpis.completionRate}%`}
        icon={Scissors}
        accent="purple"
        sub={`${kpis.monthCompleted} de ${kpis.monthApts} no mês`}
      />
    </div>
  )
}

// ── Agenda de hoje (sem cache — dado em tempo real) ───────────────

async function TodaySchedule({ todayStr }: { todayStr: string }) {
  const supabase = await createClient()
  const dayStart = `${todayStr}T00:00:00`
  const dayEnd   = `${todayStr}T23:59:59`

  const { data: todaySchedule } = await supabase
    .from('appointments')
    .select('id, scheduled_at, status, is_subscriber, total_price, client:profiles(full_name, whatsapp, phone), barber:barbers(profile:profiles(full_name)), services:appointment_services(service:services(name))')
    .gte('scheduled_at', dayStart)
    .lte('scheduled_at', dayEnd)
    .not('status', 'in', '("cancelled","no_show")')
    .order('scheduled_at', { ascending: true })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Agenda de Hoje</h2>
        <span className="text-xs text-muted-foreground">{todaySchedule?.length ?? 0} agendamentos</span>
      </div>

      {!todaySchedule?.length ? (
        <div className="flex items-center justify-center py-12 rounded-xl bg-moria-surface border border-moria-border">
          <p className="text-muted-foreground text-sm">Nenhum agendamento hoje</p>
        </div>
      ) : (
        <div className="space-y-2">
          {todaySchedule.map(apt => {
            const client   = apt.client   as any
            const barber   = apt.barber   as any
            const services = apt.services as any[]
            const phone    = client?.whatsapp ?? client?.phone

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
                <div className="text-sm font-black text-gold-DEFAULT w-12 shrink-0">
                  {format(new Date(apt.scheduled_at), 'HH:mm')}
                </div>
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
  )
}

// ── Assinaturas recentes + atalhos (cache 30s) ────────────────────

async function RecentSubscriptions() {
  const kpis = await getAdminKPIs()
  const subs = await getAdminRecentSubscriptions()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Novas Assinaturas</h2>
        <Link href="/admin/clients?filter=subscribers" className="text-xs text-gold-DEFAULT hover:underline">
          Ver todas
        </Link>
      </div>

      <div className="space-y-2">
        {subs.map((sub: any) => {
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
        {!subs.length && (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma assinatura recente</p>
        )}
      </div>

      <div className="space-y-2 pt-2 border-t border-moria-border">
        {[
          { href: '/admin/clients',  label: 'Gerenciar clientes',  count: kpis.totalClients },
          { href: '/admin/barbers',  label: 'Gerenciar barbeiros',  count: undefined },
          { href: '/admin/plans',    label: 'Gerenciar planos',     count: undefined },
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
  )
}

// ── Skeletons inline das seções ───────────────────────────────────

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-moria-surface border border-moria-border" />
      ))}
    </div>
  )
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-6 w-36 bg-moria-elevated rounded" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-moria-surface border border-moria-border" />
      ))}
    </div>
  )
}

function SidebarSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-6 w-40 bg-moria-elevated rounded" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-moria-surface border border-gold-DEFAULT/20" />
      ))}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const now      = new Date()
  const todayStr = format(startOfToday(), 'yyyy-MM-dd')

  return (
    <div className="space-y-8">
      {/* Header — renderiza instantaneamente */}
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

      {/* KPIs — do cache (30s TTL), aparecem quase instantaneamente */}
      <Suspense fallback={<KPISkeleton />}>
        <DashboardKPIs />
      </Suspense>

      {/* Agenda + Sidebar — buscam em paralelo, renderizam independentemente */}
      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<ScheduleSkeleton />}>
            <TodaySchedule todayStr={todayStr} />
          </Suspense>
        </div>

        <Suspense fallback={<SidebarSkeleton />}>
          <RecentSubscriptions />
        </Suspense>
      </div>
    </div>
  )
}
