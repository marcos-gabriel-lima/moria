import type { SupabaseClient } from '@supabase/supabase-js'
import type { ServiceCategory } from '@/types'

type Db = SupabaseClient

export type CreateServiceDto = {
  name: string
  description?: string | null
  category: ServiceCategory
  duration_minutes: number
  price: number
  covered_by_cut: boolean
  covered_by_beard: boolean
  display_order: number
}

export const servicesRepo = {
  async listAll(db: Db) {
    return db.from('services').select('*').order('display_order')
  },

  async listActive(db: Db) {
    return db.from('services').select('*').eq('is_active', true).order('display_order')
  },

  async findById(db: Db, id: string) {
    return db.from('services').select('*').eq('id', id).single()
  },

  async findByIds(db: Db, ids: string[]) {
    return db.from('services').select('*').in('id', ids).eq('is_active', true)
  },

  async create(db: Db, dto: CreateServiceDto) {
    return db.from('services').insert({ ...dto, is_active: true })
  },

  async update(db: Db, id: string, dto: Partial<CreateServiceDto>) {
    return db.from('services').update(dto).eq('id', id)
  },

  async setActive(db: Db, id: string, isActive: boolean) {
    return db.from('services').update({ is_active: isActive }).eq('id', id)
  },
} as const
