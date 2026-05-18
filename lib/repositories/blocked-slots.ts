import type { SupabaseClient } from '@supabase/supabase-js'

type Db = SupabaseClient

export const blockedSlotsRepo = {
  async findByBarberAndDay(db: Db, barberId: string, dayStart: string, dayEnd: string) {
    return db
      .from('blocked_slots')
      .select('*')
      .eq('barber_id', barberId)
      .lte('starts_at', dayEnd)
      .gte('ends_at', dayStart)
      .order('starts_at')
  },

  async create(db: Db, dto: {
    barber_id: string
    starts_at: string
    ends_at:   string
    reason:    string | null
  }) {
    return db.from('blocked_slots').insert(dto).select().single()
  },

  async delete(db: Db, id: string, barberId: string) {
    return db.from('blocked_slots').delete().eq('id', id).eq('barber_id', barberId)
  },
} as const
