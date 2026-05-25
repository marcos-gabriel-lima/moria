import { redirect } from 'next/navigation'
import { BarChart3, TrendingUp, Users, Crown, Scissors, Calendar, Award } from 'lucide-react'
import { getUser } from '@/lib/supabase/server'
import { getAdminReports } from '@/lib/queries'
import { PageHeader } from '@/components/admin/page-header'
import { StatsCard } from '@/components/admin/stats-card'
import { BarChart, HorizontalBreakdown } from '@/components/admin/bar-chart'
import { formatCurrency } from '@/lib/utils'
import { monthlyRecurringRevenue } from '@/lib/reports'

export const metadata = { title: 'Relatórios' }

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ months?: string }>
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const monthsBack = Math.min(12, Math.max(3, parseInt(params.months ?? '6')))

  const {
    revenueByMonth,
    subscriptionBreakdown,
    barberRanking,
    statusCount,
    completionRate,
    totalMonthRevenue,
    totalActiveSubscriptions,
  } = await getAdminReports(monthsBack)

  const totalMonthApts = Object.values(statusCount).reduce((s, v) => s + v, 0)

  const statusBreakdown = [
    { label: 'Concluído',       key: 'completed',    color: '#34d399' },
    { label: 'Cancelado',       key: 'cancelled',    color: '#f87171' },
    { label: 'Agendado',        key: 'scheduled',    color: '#60a5fa' },
    { label: 'Não Compareceu',  key: 'no_show',      color: '#6b7280' },
  ].map(s => ({ label: s.label, value: statusCount[s.key] ?? 0, color: s.color }))
   .filter(s => s.value > 0)

  // Receita acumulada do período
  const totalPeriodRevenue = revenueByMonth.reduce((s, m) => s + m.value, 0)

  // MRR real: soma price × count de cada plano (não mais placeholder)
  const mrr = monthlyRecurringRevenue(subscriptionBreakdown)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Relatórios"
        description="Análise financeira e operacional da barbearia"
        icon={BarChart3}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
            <span className="text-xs">Período:</span>
            {[3, 6, 12].map(m => (
              <a
                key={m}
                href={`/admin/reports?months=${m}`}
                className={`min-w-[36px] min-h-[36px] px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors flex items-center justify-center ${
                  monthsBack === m
                    ? 'bg-gold-DEFAULT text-black border-gold-DEFAULT'
                    : 'border-moria-border hover:border-gold-DEFAULT/40'
                }`}
              >
                {m}m
              </a>
            ))}
          </div>
        }
      />

      {/* KPIs do período */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          label={`Receita (${monthsBack} meses)`}
          value={formatCurrency(totalPeriodRevenue)}
          icon={TrendingUp}
          accent="gold"
          sub={`Mês atual: ${formatCurrency(totalMonthRevenue)}`}
        />
        <StatsCard
          label="Assinaturas Ativas"
          value={totalActiveSubscriptions}
          icon={Crown}
          accent="gold"
          sub="Planos recorrentes"
        />
        <StatsCard
          label="Taxa de Conclusão"
          value={`${completionRate}%`}
          icon={Scissors}
          accent={completionRate >= 80 ? 'green' : completionRate >= 60 ? 'blue' : 'red'}
          sub="Mês atual"
        />
        <StatsCard
          label="Agendamentos/mês"
          value={totalMonthApts}
          icon={Calendar}
          accent="blue"
          sub="Todos os status"
        />
      </div>

      {/* Gráficos: Receita + Breakdown */}
      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Receita por mês */}
        <div className="p-6 rounded-xl bg-moria-surface border border-moria-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Receita Mensal</h2>
            <span className="text-xs text-muted-foreground">Últimos {monthsBack} meses</span>
          </div>

          <BarChart
            data={revenueByMonth}
            formatValue={formatCurrency}
            height={140}
          />

          {/* Tabela auxiliar */}
          <div className="space-y-1 border-t border-moria-border pt-3">
            {revenueByMonth.slice(-3).reverse().map((m, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{m.label}</span>
                <span className="font-bold">{formatCurrency(m.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assinaturas por plano */}
        <div className="p-6 rounded-xl bg-moria-surface border border-moria-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Assinaturas por Plano</h2>
            <Crown className="w-4 h-4 text-gold-DEFAULT" />
          </div>

          {subscriptionBreakdown.length > 0 ? (
            <HorizontalBreakdown
              items={subscriptionBreakdown.map(s => ({ label: s.name, value: s.count }))}
              total={totalActiveSubscriptions}
            />
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma assinatura ativa</p>
          )}

          <div className="pt-3 border-t border-moria-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total de assinantes</span>
              <span className="font-black text-gold-DEFAULT">{totalActiveSubscriptions}</span>
            </div>
            {totalActiveSubscriptions > 0 && (
              <div className="mt-1">
                <p className="text-xs text-muted-foreground">
                  MRR: {formatCurrency(mrr)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ranking de Barbeiros + Status */}
      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Ranking de barbeiros */}
        <div className="p-6 rounded-xl bg-moria-surface border border-moria-border space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-gold-DEFAULT" />
            <h2 className="font-bold">Ranking de Barbeiros</h2>
            <span className="text-xs text-muted-foreground ml-auto">Mês atual</span>
          </div>

          {barberRanking.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sem dados este mês</p>
          ) : (
            <div className="space-y-3">
              {barberRanking.map((b, i) => (
                <div
                  key={b.name}
                  className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${
                    i === 0
                      ? 'border-gold-DEFAULT/40 bg-gold-DEFAULT/5'
                      : 'border-moria-border bg-moria-elevated/30'
                  }`}
                >
                  {/* Posição */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    i === 0 ? 'bg-gold-gradient text-black' :
                    i === 1 ? 'bg-muted text-foreground' :
                    'bg-moria-elevated border border-moria-border text-muted-foreground'
                  }`}>
                    {i + 1}
                  </div>

                  {/* Nome + stats */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{b.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.completed} cortes · {b.total > 0 ? Math.round((b.completed / b.total) * 100) : 0}% conclusão
                    </p>
                  </div>

                  {/* Receita */}
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm">{formatCurrency(b.revenue)}</p>
                    <p className="text-[10px] text-muted-foreground">bruto</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status de agendamentos */}
        <div className="p-6 rounded-xl bg-moria-surface border border-moria-border space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold">Status dos Agendamentos</h2>
            <span className="text-xs text-muted-foreground ml-auto">Mês atual</span>
          </div>

          {statusBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sem agendamentos este mês</p>
          ) : (
            <>
              <HorizontalBreakdown
                items={statusBreakdown}
                total={totalMonthApts}
              />

              <div className="pt-3 border-t border-moria-border space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total no mês</span>
                  <span className="font-bold">{totalMonthApts}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa de conclusão</span>
                  <span className={`font-bold ${completionRate >= 80 ? 'text-green-400' : completionRate >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {completionRate}%
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Receita mensal detalhada */}
      <div className="p-6 rounded-xl bg-moria-surface border border-moria-border space-y-4">
        <h2 className="font-bold">Histórico Detalhado de Receita</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-moria-border">
                <th className="text-left pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mês</th>
                <th className="text-right pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receita</th>
                <th className="text-right pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">vs. Anterior</th>
                <th className="text-right pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">% do total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-moria-border">
              {[...revenueByMonth].reverse().map((m, i, arr) => {
                const prev = arr[i + 1]?.value ?? null
                const diff = prev !== null ? m.value - prev : null
                const diffPct = prev && prev > 0 ? ((m.value - prev) / prev * 100).toFixed(1) : null
                const share = totalPeriodRevenue > 0 ? (m.value / totalPeriodRevenue * 100).toFixed(1) : '0'
                const isCurrentMonth = i === 0

                return (
                  <tr key={m.label} className={isCurrentMonth ? 'bg-gold-DEFAULT/5' : ''}>
                    <td className="py-3 font-medium">
                      {m.label}
                      {isCurrentMonth && (
                        <span className="ml-2 text-[10px] text-gold-DEFAULT bg-gold-DEFAULT/10 px-1.5 py-0.5 rounded-full border border-gold-DEFAULT/20">
                          atual
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right font-bold">{formatCurrency(m.value)}</td>
                    <td className="py-3 text-right hidden md:table-cell">
                      {diff !== null ? (
                        <span className={diff >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                          {diffPct && <span className="text-xs ml-1">({diffPct}%)</span>}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right text-muted-foreground hidden lg:table-cell">{share}%</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-moria-border">
                <td className="pt-3 font-bold">Total ({monthsBack} meses)</td>
                <td className="pt-3 text-right font-black text-gold-DEFAULT">{formatCurrency(totalPeriodRevenue)}</td>
                <td className="hidden md:table-cell" />
                <td className="hidden lg:table-cell" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
