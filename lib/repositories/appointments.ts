import type { SupabaseClient } from '@supabase/supabase-js'

type Db = SupabaseClient

export type CreateAppointmentDto = {
  client_id: string
  barber_id: string
  subscription_id?: string | null
  scheduled_at: string
  duration_minutes: number
  notes?: string | null
  total_price: number
}

export const appointmentsRepo = {
  async findByClient(db: Db, clientId: string) {
    return db
      .from('appointments')
      .select('*, barber:barbers(*, profile:profiles(*)), services:appointment_services(*, service:services(*))')
      .eq('client_id', clientId)
      .order('scheduled_at', { ascending: false })
  },

  async findById(db: Db, id: string) {
    return db
      .from('appointments')
      .select('client_id, status, scheduled_at')
      .eq('id', id)
      .single()
  },

  async findByBarberAndDay(db: Db, barberId: string, dayStart: string, dayEnd: string) {
    return db
      .from('appointments')
      .select('scheduled_at, duration_minutes, status')
      .eq('barber_id', barberId)
      .gte('scheduled_at', dayStart)
      .lte('scheduled_at', dayEnd)
      .not('status', 'in', '("cancelled","no_show")')
  },

  async create(db: Db, dto: CreateAppointmentDto) {
    return db.from('appointments').insert(dto).select().single()
  },

  async insertServices(db: Db, services: Array<{ appointment_id: string; service_id: string; price: number; covered_by_plan: boolean }>) {
    return db.from('appointment_services').insert(services)
  },

  async cancel(db: Db, id: string, reason?: string) {
    return db
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason ?? null,
      })
      .eq('id', id)
  },

  async complete(db: Db, id: string, barberId: string) {
    return db
      .from('appointments')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('barber_id', barberId)
      .select('id')
      .single()
  },

  async softDelete(db: Db, id: string) {
    return db.from('appointments').update({ status: 'cancelled' }).eq('id', id)
  },
} as const
