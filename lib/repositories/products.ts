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

  /**
   * Ajuste de estoque ATÔMICO via função SQL `adjust_product_stock`.
   *
   * Antes, fazíamos read-then-write em JS — sujeito a race condition entre
   * vendas/ajustes simultâneos. Agora o UPDATE acontece dentro de um único
   * statement que o Postgres serializa naturalmente.
   *
   * Requer migration: supabase/migrations/20260525000001_atomic_stock_adjustment.sql
   */
  async adjustStock(db: Db, id: string, delta: number) {
    return db.rpc('adjust_product_stock', { p_id: id, p_delta: delta })
  },
} as const
