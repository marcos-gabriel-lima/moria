import type { SupabaseClient } from '@supabase/supabase-js'

type Db = SupabaseClient

export type CreatePlanDto = {
  name: string
  slug: string
  description?: string | null
  price: number
  includes_cut: boolean
  includes_beard: boolean
  features: string[]
  display_order: number
}

export const plansRepo = {
  async listAll(db: Db) {
    return db.from('plans').select('*').order('display_order')
  },

  async listActive(db: Db) {
    return db.from('plans').select('*').eq('is_active', true).order('display_order')
  },

  async findById(db: Db, id: string) {
    return db.from('plans').select('*').eq('id', id).single()
  },

  async create(db: Db, dto: CreatePlanDto) {
    return db.from('plans').insert({ ...dto, is_active: true }).select('id').single()
  },

  async update(db: Db, id: string, dto: Partial<CreatePlanDto>) {
    return db.from('plans').update(dto).eq('id', id)
  },

  async setActive(db: Db, id: string, isActive: boolean) {
    return db.from('plans').update({ is_active: isActive }).eq('id', id)
  },
} as const
