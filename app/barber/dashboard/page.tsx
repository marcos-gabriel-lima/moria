import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Scissors, TrendingUp, Wallet, CalendarCheck } from 'lucide-react'
import { getUser } from '@/lib/supabase/server'
import { getBarberMonthStats } from '@/lib/queries'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = { title: 'Dashboard' }

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
  trend,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  accent?: boolean
  trend?: number
}) {
  return (
    <div className={`rounded-xl border p-5 space-y-3 ${accent ? 'border-gold-DEFAULT/40 bg-gradient-to-br from-gold-DEFAULT/10 to-moria-surface' : 'border-moria-border bg-moria-surface'}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <Icon className={`w-4 h-4 ${accent ? 'text-gold-DEFAULT' : 'text-muted-foreground'}`} />
      </div>
      <div>
        <p className={`text-2xl font-black ${accent ? 'text-gold-DEFAULT' : ''}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {trend !== undefined && (
        <p className={`text-xs font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? '+' : ''}{trend}% vs mês anterior
        </p>
      )}
    </div>
  )
}

export default async function BarberDashboardPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!['barber', 'admin'].includes(profile?.role ?? '')) redirect('/dashboard')

  const stats = await getBarberMonthStats(user.id)
  const now = new Date()
  const monthLabel = format(now, 'MMMM yyyy', { locale: ptBR })
  const firstName  = profile?.full_name?.split(' ')[0] ?? 'Barbeiro'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Olá, {firstName}!</h1>
        <p className="text-sm text-muted-foreground mt-1 capitalize">{monthLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          label="Cortes no mês"
          value={String(stats.monthCuts)}
          sub="concluídos"
          icon={Scissors}
          trend={stats.cutsTrend}
        />
        <KpiCard
          label="Hoje"
          value={String(stats.todayCount)}
          sub={stats.todayCount === 1 ? 'agendamento' : 'agendamentos'}
          icon={CalendarCheck}
        />
        <KpiCard
          label="Faturamento bruto"
          value={formatCurrency(stats.monthRevenue)}
          sub="total dos serviços"
          icon={TrendingUp}
        />
        <KpiCard
          label="Comissão estimada"
          value={formatCurrency(stats.commission)}
          sub={`${Math.round(stats.commissionRate * 100)}% do faturamento`}
          icon={Wallet}
          accent
        />
      </div>

      <div className="grid gap-3">
        <Link
          href="/barber/schedule"
          className="flex items-center justify-between rounded-xl border border-moria-border bg-moria-surface p-4 hover:border-gold-DEFAULT/40 transition-colors group"
        >
          <div>
            <p className="font-semibold text-sm">Ver agenda de hoje</p>
            <p className="text-xs text-muted-foreground">{stats.todayCount} atendimento{stats.todayCount !== 1 ? 's' : ''} pendente{stats.todayCount !== 1 ? 's' : ''}</p>
          </div>
          <CalendarCheck className="w-5 h-5 text-muted-foreground group-hover:text-gold-DEFAULT transition-colors" />
        </Link>

        <Link
          href="/barber/history"
          className="flex items-center justify-between rounded-xl border border-moria-border bg-moria-surface p-4 hover:border-gold-DEFAULT/40 transition-colors group"
        >
          <div>
            <p className="font-semibold text-sm">Histórico de atendimentos</p>
            <p className="text-xs text-muted-foreground">{stats.monthCuts} cortes este mês</p>
          </div>
          <TrendingUp className="w-5 h-5 text-muted-foreground group-hover:text-gold-DEFAULT transition-colors" />
        </Link>

        <Link
          href="/barber/profile"
          className="flex items-center justify-between rounded-xl border border-moria-border bg-moria-surface p-4 hover:border-gold-DEFAULT/40 transition-colors group"
        >
          <div>
            <p className="font-semibold text-sm">Meu perfil</p>
            <p className="text-xs text-muted-foreground">Editar bio, horários e especialidades</p>
          </div>
          <Scissors className="w-5 h-5 text-muted-foreground group-hover:text-gold-DEFAULT transition-colors" />
        </Link>
      </div>
    </div>
  )
}
