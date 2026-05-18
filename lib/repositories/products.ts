import type { SupabaseClient } from '@supabase/supabase-js'

type Db = SupabaseClient

export type CreateProductDto = {
  name: string
  description?: string | null
  price: number
  stock: number
  category?: string | null
  image_url?: string | null
}

export const productsRepo = {
  async list(db: Db) {
    return db
      .from('products')
      .select('*')
      .order('is_active', { ascending: false })
      .order('name')
  },

  async findById(db: Db, id: string) {
    return db.from('products').select('*').eq('id', id).single()
  },

  async create(db: Db, dto: CreateProductDto) {
    return db
      .from('products')
      .insert({ ...dto, is_active: true })
      .select('id')
      .single()
  },

  async update(db: Db, id: string, dto: Partial<CreateProductDto>) {
    return db.from('products').update(dto).eq('id', id)
  },

  async setActive(db: Db, id: string, isActive: boolean) {
    return db.from('products').update({ is_active: isActive }).eq('id', id)
  },

  async adjustStock(db: Db, id: string, delta: number) {
    const { data, error } = await db
      .from('products')
      .select('stock')
      .eq('id', id)
      .single()
    if (error) return { data: null, error }
    const newStock = Math.max(0, data.stock + delta)
    return db.from('products').update({ stock: newStock }).eq('id', id)
  },
} as const
