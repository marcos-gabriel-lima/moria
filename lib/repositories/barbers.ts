import type { SupabaseClient } from '@supabase/supabase-js'

type Db = SupabaseClient

export type CreateBarberDto = {
  id: string
  specialty: string[]
  bio?: string | null
  instagram?: string | null
  commission_rate: number
  works_monday: boolean
  works_tuesday: boolean
  works_wednesday: boolean
  works_thursday: boolean
  works_friday: boolean
  works_saturday: boolean
  works_sunday: boolean
  start_time: string
  end_time: string
}

export type UpdateBarberDto = Omit<CreateBarberDto, 'id'>

export const barbersRepo = {
  async listAll(db: Db) {
    return db
      .from('barbers')
      .select('*, profile:profiles(*)')
      .order('is_active', { ascending: false })
  },

  async listActive(db: Db) {
    return db
      .from('barbers')
      .select('*, profile:profiles(*)')
      .eq('is_active', true)
  },

  async findById(db: Db, id: string) {
    return db.from('barbers').select('*, profile:profiles(*)').eq('id', id).single()
  },

  async countCompletedByMonth(db: Db, monthStart: string, monthEnd: string) {
    return db
      .from('appointments')
      .select('barber_id')
      .eq('status', 'completed')
      .gte('scheduled_at', monthStart)
      .lte('scheduled_at', monthEnd)
  },

  async create(db: Db, dto: CreateBarberDto) {
    return db.from('barbers').insert(dto)
  },

  async update(db: Db, id: string, dto: Partial<UpdateBarberDto>) {
    return db.from('barbers').update(dto).eq('id', id)
  },

  async setActive(db: Db, id: string, isActive: boolean) {
    return db.from('barbers').update({ is_active: isActive }).eq('id', id)
  },

  async setCommission(db: Db, id: string, rate: number) {
    return db.from('barbers').update({ commission_rate: rate }).eq('id', id)
  },
} as const
