// Mock data for demo mode — no Supabase required

export const DEMO_USER = {
  id: 'demo-user-id',
  full_name: 'Carlos Mendes',
  email: 'carlos@exemplo.com',
  role: 'client' as const,
  is_active: true,
  avatar_url: null,
  whatsapp: '11999990000',
}

export const DEMO_PLANS = [
  {
    id: 'plan-1',
    name: 'Corte Ilimitado',
    slug: 'corte-ilimitado',
    description: 'Cortes ilimitados todo mês. Agende quando quiser, sem limites.',
    price: 150,
    includes_cut: true,
    includes_beard: false,
    is_active: true,
    display_order: 1,
    features: [
      'Cortes ilimitados',
      'Prioridade no agendamento',
      'Agendamento com qualquer antecedência',
      'Carteira digital exclusiva',
    ],
  },
  {
    id: 'plan-2',
    name: 'Barba Ilimitada',
    slug: 'barba-ilimitada',
    description: 'Barbas ilimitadas todo mês. Mantenha sempre o visual impecável.',
    price: 89,
    includes_cut: false,
    includes_beard: true,
    is_active: true,
    display_order: 2,
    features: [
      'Barbas ilimitadas',
      'Prioridade no agendamento',
      'Agendamento com qualquer antecedência',
      'Carteira digital exclusiva',
    ],
  },
  {
    id: 'plan-3',
    name: 'Corte + Barba Ilimitado',
    slug: 'corte-barba-ilimitado',
    description: 'O pacote completo. Corte e barba ilimitados todo mês.',
    price: 199,
    includes_cut: true,
    includes_beard: true,
    is_active: true,
    display_order: 3,
    features: [
      'Cortes ilimitados',
      'Barbas ilimitadas',
      'Prioridade máxima no agendamento',
      'Agendamento com qualquer antecedência',
      'Carteira digital exclusiva',
      'Desconto em produtos',
    ],
  },
]

export const DEMO_SUBSCRIPTION = {
  id: 'sub-demo-001',
  client_id: 'demo-user-id',
  plan_id: 'plan-3',
  status: 'active' as const,
  starts_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
  qr_code_token: 'MORIA-DEMO-SUB-001-C3B4ILIMITADO',
  plan: DEMO_PLANS[2],
}

export const DEMO_BARBERS = [
  {
    id: 'barber-1',
    profile: { full_name: 'Rafael Costa', avatar_url: null },
    bio: 'Especialista em cortes modernos e degradê',
    is_active: true,
  },
  {
    id: 'barber-2',
    profile: { full_name: 'Lucas Andrade', avatar_url: null },
    bio: 'Mestre em barbas e estilo clássico',
    is_active: true,
  },
  {
    id: 'barber-3',
    profile: { full_name: 'Gabriel Ferreira', avatar_url: null },
    bio: 'Especialista em pigmentação e tratamentos',
    is_active: true,
  },
]

const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)
const dayAfter = new Date(today)
dayAfter.setDate(today.getDate() + 3)

export const DEMO_APPOINTMENTS = [
  {
    id: 'apt-1',
    scheduled_at: new Date(tomorrow.setHours(10, 0, 0, 0)).toISOString(),
    status: 'confirmed' as const,
    is_subscriber: true,
    total_price: 65,
    notes: null,
    barber: DEMO_BARBERS[0],
    services: [{ service: { name: 'Corte + Barba', duration_minutes: 60 } }],
    client: DEMO_USER,
  },
  {
    id: 'apt-2',
    scheduled_at: new Date(dayAfter.setHours(14, 30, 0, 0)).toISOString(),
    status: 'scheduled' as const,
    is_subscriber: true,
    total_price: 0,
    notes: 'Quero degradê baixo',
    barber: DEMO_BARBERS[1],
    services: [{ service: { name: 'Corte Degradê', duration_minutes: 40 } }],
    client: DEMO_USER,
  },
  {
    id: 'apt-3',
    scheduled_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed' as const,
    is_subscriber: true,
    total_price: 0,
    notes: null,
    barber: DEMO_BARBERS[0],
    services: [{ service: { name: 'Corte Social', duration_minutes: 30 } }],
    client: DEMO_USER,
  },
  {
    id: 'apt-4',
    scheduled_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed' as const,
    is_subscriber: true,
    total_price: 0,
    notes: null,
    barber: DEMO_BARBERS[2],
    services: [{ service: { name: 'Corte + Barba', duration_minutes: 60 } }],
    client: DEMO_USER,
  },
]

// Admin dashboard mock
export const DEMO_ADMIN = {
  monthRevenue: 8740,
  prevRevenue: 7210,
  activeSubscriptions: 47,
  todayApts: 12,
  monthApts: 184,
  monthCompleted: 171,
  totalClients: 132,
  revTrend: 21,
  completionRate: 93,
}

export const DEMO_TODAY_SCHEDULE = [
  {
    id: 'today-1',
    scheduled_at: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
    status: 'completed',
    is_subscriber: true,
    total_price: 0,
    client: { full_name: 'Pedro Alves', whatsapp: '11991110000' },
    barber: { profile: { full_name: 'Rafael Costa' } },
    services: [{ service: { name: 'Corte Degradê' } }],
  },
  {
    id: 'today-2',
    scheduled_at: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    status: 'confirmed',
    is_subscriber: true,
    total_price: 0,
    client: { full_name: 'Carlos Mendes', whatsapp: '11999990000' },
    barber: { profile: { full_name: 'Rafael Costa' } },
    services: [{ service: { name: 'Corte + Barba' } }],
  },
  {
    id: 'today-3',
    scheduled_at: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
    status: 'scheduled',
    is_subscriber: false,
    total_price: 40,
    client: { full_name: 'Bruno Lima', whatsapp: null },
    barber: { profile: { full_name: 'Lucas Andrade' } },
    services: [{ service: { name: 'Corte Degradê' } }],
  },
  {
    id: 'today-4',
    scheduled_at: new Date(new Date().setHours(13, 30, 0, 0)).toISOString(),
    status: 'scheduled',
    is_subscriber: true,
    total_price: 0,
    client: { full_name: 'Mateus Souza', whatsapp: '11988880000' },
    barber: { profile: { full_name: 'Gabriel Ferreira' } },
    services: [{ service: { name: 'Barba Completa' } }],
  },
  {
    id: 'today-5',
    scheduled_at: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
    status: 'scheduled',
    is_subscriber: false,
    total_price: 45,
    client: { full_name: 'Diego Santos', whatsapp: '11977770000' },
    barber: { profile: { full_name: 'Rafael Costa' } },
    services: [{ service: { name: 'Corte Navalhado' } }],
  },
]

export const DEMO_RECENT_SUBSCRIPTIONS = [
  { id: 'rs-1', client: { full_name: 'Felipe Rocha',   whatsapp: '11966660000' }, plan: { name: 'Corte + Barba Ilimitado', price: 199 } },
  { id: 'rs-2', client: { full_name: 'André Oliveira', whatsapp: '11955550000' }, plan: { name: 'Corte Ilimitado',          price: 150 } },
  { id: 'rs-3', client: { full_name: 'Thiago Nunes',   whatsapp: '11944440000' }, plan: { name: 'Barba Ilimitada',          price: 89  } },
  { id: 'rs-4', client: { full_name: 'Ricardo Pinto',  whatsapp: null            }, plan: { name: 'Corte + Barba Ilimitado', price: 199 } },
  { id: 'rs-5', client: { full_name: 'Gustavo Melo',   whatsapp: '11933330000' }, plan: { name: 'Corte Ilimitado',          price: 150 } },
]
