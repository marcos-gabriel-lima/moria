// ============================================================
// MORIA — Tipos centrais do sistema
// ============================================================

// ── Utility types ────────────────────────────────────────────

/** Torna um objeto completamente readonly em profundidade */
export type DeepReadonly<T> = T extends (infer U)[]
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T

/** Expande interseções para melhor legibilidade no hover */
export type Prettify<T> = { [K in keyof T]: T[K] } & {}

/** Torna campos específicos obrigatórios */
export type RequireFields<T, K extends keyof T> = Prettify<Omit<T, K> & Required<Pick<T, K>>>

/** Torna campos específicos opcionais */
export type PartialBy<T, K extends keyof T> = Prettify<Omit<T, K> & Partial<Pick<T, K>>>

// ── Branded IDs ──────────────────────────────────────────────
// Evitam passar IDs errados entre funções sem custo de runtime

declare const __brand: unique symbol
type Brand<T, B extends string> = T & { readonly [__brand]: B }

export type UserId         = Brand<string, 'UserId'>
export type PlanId         = Brand<string, 'PlanId'>
export type BarberId       = Brand<string, 'BarberId'>
export type ServiceId      = Brand<string, 'ServiceId'>
export type AppointmentId  = Brand<string, 'AppointmentId'>
export type SubscriptionId = Brand<string, 'SubscriptionId'>
export type ProductId      = Brand<string, 'ProductId'>

// ── Enums de domínio ─────────────────────────────────────────

export type UserRole           = 'client' | 'barber' | 'admin'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending'
export type AppointmentStatus  = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
export type PaymentMethod      = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'plan'
export type PaymentStatus      = 'pending' | 'paid' | 'failed' | 'refunded'
export type ServiceCategory    = 'haircut' | 'beard' | 'combo' | 'treatment' | 'other'

// ── Entidades ────────────────────────────────────────────────

export interface Profile {
  id:          string
  full_name:   string
  phone:       string | null
  avatar_url:  string | null
  role:        UserRole
  whatsapp:    string | null
  birth_date:  string | null
  notes:       string | null
  is_active:   boolean
  created_at:  string
  updated_at:  string
}

export interface Plan {
  id:                  string
  name:                string
  slug:                string
  description:         string | null
  price:               number
  includes_cut:        boolean
  includes_beard:      boolean
  max_cuts_per_month:  number | null
  max_beards_per_month: number | null
  features:            string[]
  is_active:           boolean
  display_order:       number
  created_at:          string
  updated_at:          string
}

export interface Subscription {
  id:             string
  client_id:      string
  plan_id:        string
  status:         SubscriptionStatus
  started_at:     string | null
  expires_at:     string | null
  cancelled_at:   string | null
  cancel_reason:  string | null
  qr_code_token:  string | null
  payment_method: PaymentMethod | null
  external_id:    string | null
  auto_renew:     boolean
  created_at:     string
  updated_at:     string
  plan?:   Plan
  client?: Profile
}

export interface Barber {
  id:              string
  specialty:       string[] | null
  bio:             string | null
  instagram:       string | null
  commission_rate: number
  works_monday:    boolean
  works_tuesday:   boolean
  works_wednesday: boolean
  works_thursday:  boolean
  works_friday:    boolean
  works_saturday:  boolean
  works_sunday:    boolean
  start_time:      string
  end_time:        string
  is_active:       boolean
  created_at:      string
  profile?:        Profile
}

export interface Service {
  id:               string
  name:             string
  description:      string | null
  category:         ServiceCategory
  duration_minutes: number
  price:            number
  covered_by_cut:   boolean
  covered_by_beard: boolean
  is_active:        boolean
  display_order:    number
  created_at:       string
  updated_at:       string
}

export interface Appointment {
  id:               string
  client_id:        string
  barber_id:        string
  subscription_id:  string | null
  status:           AppointmentStatus
  scheduled_at:     string
  duration_minutes: number
  notes:            string | null
  is_subscriber:    boolean
  checked_in_at:    string | null
  completed_at:     string | null
  cancelled_at:     string | null
  cancel_reason:    string | null
  total_price:      number
  created_at:       string
  updated_at:       string
  client?:       Profile
  barber?:       Barber & { profile: Profile }
  services?:     AppointmentService[]
  subscription?: Subscription
}

export interface AppointmentService {
  id:              string
  appointment_id:  string
  service_id:      string
  price:           number
  covered_by_plan: boolean
  created_at:      string
  service?:        Service
}

export interface Product {
  id:          string
  name:        string
  description: string | null
  price:       number
  stock:       number
  image_url:   string | null
  category:    string | null
  is_active:   boolean
  created_at:  string
  updated_at:  string
}

export interface Payment {
  id:              string
  client_id:       string
  appointment_id:  string | null
  subscription_id: string | null
  amount:          number
  method:          PaymentMethod
  status:          PaymentStatus
  external_id:     string | null
  pix_key:         string | null
  pix_qr_code:     string | null
  paid_at:         string | null
  refunded_at:     string | null
  notes:           string | null
  created_at:      string
  updated_at:      string
}

export interface BlockedSlot {
  id:         string
  barber_id:  string
  starts_at:  string
  ends_at:    string
  reason:     string | null
  created_at: string
}

// ── Tipos auxiliares de UI ────────────────────────────────────

export interface TimeSlot {
  time:      string
  datetime:  Date
  available: boolean
  isBlocked: boolean
}

export interface DashboardStats {
  totalRevenue:        number
  monthRevenue:        number
  activeSubscriptions: number
  totalAppointments:   number
  todayAppointments:   number
  completionRate:      number
}

// ── Result pattern ────────────────────────────────────────────

export type Ok<T>  = { success: true;  data: T }
export type Err    = { success: false; error: string }
export type ActionResult<T = void> = Ok<T> | Err

/** Type guard para narrowing de ActionResult */
export function isOk<T>(result: ActionResult<T>): result is Ok<T> {
  return result.success === true
}

/** Mapeia o valor de sucesso de um ActionResult */
export function mapResult<T, U>(
  result: ActionResult<T>,
  fn: (data: T) => U
): ActionResult<U> {
  if (!result.success) return result
  return { success: true, data: fn(result.data) }
}
