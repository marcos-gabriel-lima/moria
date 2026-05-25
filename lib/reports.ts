// Helpers puros pra cálculos de relatório/KPI.
// Sem dependência de Supabase ou Next — testáveis isoladamente.

export type MonthRevenue = { label: string; value: number }

/** Soma a receita de todos os meses do período. */
export function sumRevenue(months: MonthRevenue[]): number {
  return months.reduce((acc, m) => acc + m.value, 0)
}

/** Variação MoM (mês vs mês anterior) em valor absoluto e percentual. */
export function monthOverMonthDiff(
  current: number,
  previous: number | null,
): { diff: number | null; pctLabel: string | null } {
  if (previous === null) return { diff: null, pctLabel: null }
  const diff = current - previous
  if (previous === 0) return { diff, pctLabel: null }
  const pct = (diff / previous) * 100
  return { diff, pctLabel: `${pct.toFixed(1)}%` }
}

/** Participação percentual de um mês no total do período. */
export function monthShare(monthValue: number, totalPeriod: number): string {
  if (totalPeriod <= 0) return '0'
  return ((monthValue / totalPeriod) * 100).toFixed(1)
}

/**
 * Taxa de conclusão = completados / (completados + cancelados + no_show).
 * Agendamentos ainda em andamento não entram no denominador.
 */
export function completionRate(statusCount: Record<string, number>): number {
  const completed = statusCount['completed'] ?? 0
  const cancelled = statusCount['cancelled'] ?? 0
  const noShow    = statusCount['no_show']   ?? 0
  const finished  = completed + cancelled + noShow
  if (finished === 0) return 0
  return Math.round((completed / finished) * 100)
}

/** Mapeia completionRate em cor pro KPI card. */
export function completionRateAccent(rate: number): 'green' | 'blue' | 'red' {
  if (rate >= 80) return 'green'
  if (rate >= 60) return 'blue'
  return 'red'
}

/** Total de agendamentos no mês (qualquer status). */
export function totalAppointments(statusCount: Record<string, number>): number {
  return Object.values(statusCount).reduce((s, v) => s + v, 0)
}

/**
 * MRR (Monthly Recurring Revenue) — soma o price * count de cada plano ativo.
 * NOTA: substitui o "placeholder R$ 150" que estava hardcoded em app/admin/reports/page.tsx.
 */
export type PlanBreakdownItem = { name: string; count: number; price: number }
export function monthlyRecurringRevenue(items: PlanBreakdownItem[]): number {
  return items.reduce((acc, item) => acc + item.count * item.price, 0)
}

/**
 * Ranking de barbeiros — ordena por receita desc.
 * Empate: maior taxa de conclusão fica na frente.
 */
export type BarberStats = {
  name: string
  completed: number
  total: number
  revenue: number
}
export function rankBarbers(stats: BarberStats[]): BarberStats[] {
  return [...stats].sort((a, b) => {
    if (b.revenue !== a.revenue) return b.revenue - a.revenue
    const aRate = a.total > 0 ? a.completed / a.total : 0
    const bRate = b.total > 0 ? b.completed / b.total : 0
    return bRate - aRate
  })
}

/** Calcula taxa de conclusão por barbeiro (% inteiro). */
export function barberCompletionRate(barber: Pick<BarberStats, 'completed' | 'total'>): number {
  if (barber.total === 0) return 0
  return Math.round((barber.completed / barber.total) * 100)
}

/**
 * Calcula a comissão do barbeiro.
 *
 * CONTRATO: `commissionRatePercent` está em formato PERCENTUAL (0-100),
 * que é como o BD armazena (coluna `barbers.commission_rate numeric(5,2) default 50.00`).
 *
 * Exemplo:
 *   calculateCommission(10000, 50)  // → 5000 (50% de R$ 10.000)
 *   calculateCommission(10000, 40)  // → 4000 (40% de R$ 10.000)
 */
export function calculateCommission(
  revenue: number,
  commissionRatePercent: number,
): number {
  return revenue * (commissionRatePercent / 100)
}
