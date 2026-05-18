import { unstable_cache } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

// Cliente anon — para dados públicos (plans, services, products, barbers)
function db() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Cliente service role — bypassa RLS, só usado em cache server-side
function adminDb() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Dados públicos ────────────────────────────────────────────────

export const getPlansCache = unstable_cache(
  async () => {
    try {
      const { data } = await db().from('plans').select('*').order('display_order')
      return data ?? []
    } catch { return [] }
  },
  ['plans'],
  { revalidate: 300, tags: ['plans'] }
)

export const getServicesCache = unstable_cache(
  async () => {
    try {
      const { data } = await db()
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('display_order')
      return data ?? []
    } catch { return [] }
  },
  ['services'],
  { revalidate: 300, tags: ['services'] }
)

export const getActiveBarbersCache = unstable_cache(
  async () => {
    try {
      const { data } = await db()
        .from('barbers')
        .select('*, profile:profiles(id, full_name, avatar_url)')
        .eq('is_active', true)
      return data ?? []
    } catch { return [] }
  },
  ['active-barbers'],
  { revalidate: 60, tags: ['barbers'] }
)

export const getProductsCache = unstable_cache(
  async () => {
    try {
      const { data } = await db()
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name')
      return data ?? []
    } catch { return [] }
  },
  ['products'],
  { revalidate: 300, tags: ['products'] }
)

// ── Admin: KPIs do mês (30s TTL) ─────────────────────────────────

export const getAdminKPIs = unstable_cache(
  async () => {
    const supabase = adminDb()
    const now = new Date()
    const monthStart = startOfMonth(now).toISOString()
    const monthEnd   = endOfMonth(now).toISOString()
    const prevStart  = startOfMonth(subMonths(now, 1)).toISOString()
    const prevEnd    = endOfMonth(subMonths(now, 1)).toISOString()

    const [
      { count: totalClients },
      { count: activeSubscriptions },
      { count: monthApts },
      { count: monthCompleted },
      { data: monthPayments },
      { data: prevPayments },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client').eq('is_active', true),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active').gt('expires_at', now.toISOString()),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('scheduled_at', monthStart).lte('scheduled_at', monthEnd).not('status', 'in', '("cancelled","no_show")'),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('scheduled_at', monthStart).lte('scheduled_at', monthEnd),
      supabase.from('payments').select('amount').eq('status', 'paid').gte('paid_at', monthStart).lte('paid_at', monthEnd),
      supabase.from('payments').select('amount').eq('status', 'paid').gte('paid_at', prevStart).lte('paid_at', prevEnd),
    ])

    const monthRevenue = (monthPayments ?? []).reduce((s, p) => s + p.amount, 0)
    const prevRevenue  = (prevPayments  ?? []).reduce((s, p) => s + p.amount, 0)
    const revTrend     = prevRevenue > 0 ? Math.round(((monthRevenue - prevRevenue) / prevRevenue) * 100) : 0
    const completionRate = (monthApts ?? 0) > 0
      ? Math.round(((monthCompleted ?? 0) / (monthApts ?? 1)) * 100)
      : 0

    return {
      totalClients:       totalClients       ?? 0,
      activeSubscriptions:activeSubscriptions?? 0,
      monthApts:          monthApts          ?? 0,
      monthCompleted:     monthCompleted     ?? 0,
      monthRevenue,
      prevRevenue,
      revTrend,
      completionRate,
    }
  },
  ['admin-kpis'],
  { revalidate: 30, tags: ['admin-kpis'] }
)

// ── Admin: Assinaturas recentes (30s TTL) ─────────────────────────

export const getAdminRecentSubscriptions = unstable_cache(
  async () => {
    const { data } = await adminDb()
      .from('subscriptions')
      .select('id, status, created_at, client:profiles(full_name, whatsapp), plan:plans(name, price)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5)
    return data ?? []
  },
  ['admin-recent-subs'],
  { revalidate: 30, tags: ['admin-recent-subs'] }
)

// ── Admin: Clientes com filtros e paginação (15s TTL) ────────────

export const getAdminClients = unstable_cache(
  async (page: number, limit: number, query: string, filter: string) => {
    const supabase = adminDb()
    const offset   = (page - 1) * limit
    const now      = new Date().toISOString()

    const selectClients = `
      id, full_name, phone, whatsapp, is_active, created_at,
      subscription:subscriptions(id, status, expires_at, plan:plans(name, price))
    `

    if (filter === 'subscribers') {
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('client_id')
        .eq('status', 'active')
        .gt('expires_at', now)

      const ids = subs?.map(s => s.client_id) ?? []
      if (!ids.length) return { clients: [], count: 0 }

      let qb = supabase
        .from('profiles')
        .select(selectClients, { count: 'exact' })
        .in('id', ids)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (query) qb = qb.or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,whatsapp.ilike.%${query}%`)

      const { data, count } = await qb
      return { clients: data ?? [], count: count ?? 0 }
    }

    let qb = supabase
      .from('profiles')
      .select(selectClients, { count: 'exact' })
      .eq('role', 'client')
      .eq('is_active', filter === 'inactive' ? false : true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (query) qb = qb.or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,whatsapp.ilike.%${query}%`)

    const { data, count } = await qb
    return { clients: data ?? [], count: count ?? 0 }
  },
  ['admin-clients'],
  { revalidate: 15, tags: ['admin-clients'] }
)

// ── Admin: Barbeiros com cortes do mês (30s TTL) ──────────────────

export const getAdminBarbers = unstable_cache(
  async () => {
    const supabase   = adminDb()
    const now        = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    const [{ data: barbers }, { data: monthCounts }] = await Promise.all([
      supabase
        .from('barbers')
        .select('*, profile:profiles(id, full_name, phone, whatsapp, avatar_url, created_at)')
        .order('is_active', { ascending: false }),
      supabase
        .from('appointments')
        .select('barber_id')
        .eq('status', 'completed')
        .gte('scheduled_at', monthStart)
        .lte('scheduled_at', monthEnd),
    ])

    const aptCounts: Record<string, number> = {}
    monthCounts?.forEach(c => {
      aptCounts[c.barber_id] = (aptCounts[c.barber_id] ?? 0) + 1
    })

    return { barbers: barbers ?? [], aptCounts }
  },
  ['admin-barbers'],
  { revalidate: 30, tags: ['admin-barbers'] }
)

// ── Admin: Planos + Serviços + assinantes ativos (60s TTL) ────────

export const getAdminPlans = unstable_cache(
  async () => {
    const supabase = adminDb()
    const now      = new Date().toISOString()

    const [{ data: plans }, { data: services }, { data: activeSubs }] = await Promise.all([
      supabase.from('plans').select('*').order('display_order'),
      supabase.from('services').select('*').order('display_order'),
      supabase.from('subscriptions').select('plan_id').eq('status', 'active').gt('expires_at', now),
    ])

    const subCountByPlan: Record<string, number> = {}
    activeSubs?.forEach(s => {
      subCountByPlan[s.plan_id] = (subCountByPlan[s.plan_id] ?? 0) + 1
    })

    return { plans: plans ?? [], services: services ?? [], subCountByPlan }
  },
  ['admin-plans'],
  { revalidate: 60, tags: ['admin-plans'] }
)

// ── Admin: Produtos (30s TTL) ─────────────────────────────────────

export const getAdminProducts = unstable_cache(
  async () => {
    const { data } = await adminDb()
      .from('products')
      .select('*')
      .order('is_active', { ascending: false })
      .order('name')
    return data ?? []
  },
  ['admin-products'],
  { revalidate: 30, tags: ['admin-products'] }
)

// ── Barbeiro: KPIs do mês + hoje (30s TTL, por barbeiro) ─────────

export const getBarberMonthStats = unstable_cache(
  async (barberId: string) => {
    const supabase   = adminDb()
    const now        = new Date()
    const today      = now.toISOString().split('T')[0]
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
    const prevStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const prevEnd    = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

    const [
      { data: barberData },
      { data: monthApts },
      { data: prevApts },
      { count: todayCount },
    ] = await Promise.all([
      supabase.from('barbers').select('commission_rate').eq('id', barberId).single(),
      supabase
        .from('appointments')
        .select('total_price, status')
        .eq('barber_id', barberId)
        .eq('status', 'completed')
        .gte('scheduled_at', monthStart)
        .lte('scheduled_at', monthEnd),
      supabase
        .from('appointments')
        .select('total_price')
        .eq('barber_id', barberId)
        .eq('status', 'completed')
        .gte('scheduled_at', prevStart)
        .lte('scheduled_at', prevEnd),
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('barber_id', barberId)
        .gte('scheduled_at', `${today}T00:00:00.000Z`)
        .lte('scheduled_at', `${today}T23:59:59.999Z`)
        .not('status', 'in', '("cancelled","no_show")'),
    ])

    const commissionRate = barberData?.commission_rate ?? 0.4
    const monthRevenue   = (monthApts ?? []).reduce((s, a) => s + (a.total_price ?? 0), 0)
    const prevRevenue    = (prevApts  ?? []).reduce((s, a) => s + (a.total_price ?? 0), 0)
    const monthCuts      = monthApts?.length ?? 0
    const prevCuts       = prevApts?.length  ?? 0
    const commission     = monthRevenue * commissionRate
    const cutsTrend      = prevCuts > 0 ? Math.round(((monthCuts - prevCuts) / prevCuts) * 100) : 0

    return {
      monthCuts,
      prevCuts,
      cutsTrend,
      monthRevenue,
      commission,
      commissionRate,
      todayCount: todayCount ?? 0,
    }
  },
  ['barber-month-stats'],
  { revalidate: 30, tags: ['barber-stats'] }
)

// ── Barbeiro: Histórico paginado (15s TTL) ────────────────────────

export const getBarberHistory = unstable_cache(
  async (barberId: string, page: number, limit: number, status: string, month: string) => {
    const supabase = adminDb()
    const offset   = (page - 1) * limit

    let qb = supabase
      .from('appointments')
      .select(`
        id, scheduled_at, status, total_price, is_subscriber, duration_minutes,
        client:profiles(full_name, phone),
        services:appointment_services(*, service:services(name))
      `, { count: 'exact' })
      .eq('barber_id', barberId)
      .order('scheduled_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') qb = qb.eq('status', status)
    if (month) {
      const [y, m] = month.split('-').map(Number)
      const start  = new Date(y, m - 1, 1).toISOString()
      const end    = new Date(y, m, 0, 23, 59, 59).toISOString()
      qb = qb.gte('scheduled_at', start).lte('scheduled_at', end)
    }

    const { data, count } = await qb
    return { appointments: data ?? [], count: count ?? 0 }
  },
  ['barber-history'],
  { revalidate: 15, tags: ['barber-history'] }
)

// ── Admin: Relatórios (60s TTL) ───────────────────────────────────

export const getAdminReports = unstable_cache(
  async (monthsBack: number) => {
    const supabase = adminDb()
    const now = new Date()

    const months = Array.from({ length: monthsBack }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      return {
        label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString(),
        end:   new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString(),
      }
    }).reverse()

    const [
      { data: payments },
      { data: subscriptionsByPlan },
      { data: barberStats },
      { data: appointmentsByStatus },
    ] = await Promise.all([
      supabase.from('payments').select('amount, paid_at').eq('status', 'paid').gte('paid_at', months[0].start),
      supabase.from('subscriptions').select('plan_id, plan:plans(name), status').eq('status', 'active').gt('expires_at', now.toISOString()),
      supabase.from('appointments')
        .select('barber_id, status, total_price, barber:barbers(profile:profiles(full_name))')
        .gte('scheduled_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
        .lte('scheduled_at', new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()),
      supabase.from('appointments').select('status')
        .gte('scheduled_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
    ])

    const revenueByMonth = months.map(m => ({
      label: m.label,
      value: (payments ?? [])
        .filter(p => p.paid_at && p.paid_at >= m.start && p.paid_at <= m.end)
        .reduce((sum, p) => sum + p.amount, 0),
    }))

    const planMap: Record<string, { name: string; count: number }> = {}
    ;(subscriptionsByPlan ?? []).forEach((s: any) => {
      const id = s.plan_id
      if (!planMap[id]) planMap[id] = { name: s.plan?.name ?? id, count: 0 }
      planMap[id].count++
    })

    const barberMap: Record<string, { name: string; completed: number; revenue: number; total: number }> = {}
    ;(barberStats ?? []).forEach((a: any) => {
      const id = a.barber_id
      const name = (a.barber as any)?.profile?.full_name ?? 'Barbeiro'
      if (!barberMap[id]) barberMap[id] = { name, completed: 0, revenue: 0, total: 0 }
      barberMap[id].total++
      if (a.status === 'completed') { barberMap[id].completed++; barberMap[id].revenue += a.total_price ?? 0 }
    })

    const statusCount: Record<string, number> = {}
    ;(appointmentsByStatus ?? []).forEach(a => {
      statusCount[a.status] = (statusCount[a.status] ?? 0) + 1
    })
    const total = Object.values(statusCount).reduce((s, v) => s + v, 0)

    return {
      revenueByMonth,
      subscriptionBreakdown: Object.values(planMap).sort((a, b) => b.count - a.count),
      barberRanking: Object.values(barberMap).sort((a, b) => b.revenue - a.revenue),
      statusCount,
      completionRate: total > 0 ? Math.round(((statusCount.completed ?? 0) / total) * 100) : 0,
      totalMonthRevenue: revenueByMonth[revenueByMonth.length - 1]?.value ?? 0,
      totalActiveSubscriptions: subscriptionsByPlan?.length ?? 0,
    }
  },
  ['admin-reports'],
  { revalidate: 60, tags: ['admin-reports'] }
)
