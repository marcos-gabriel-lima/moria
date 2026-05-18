import type { SupabaseClient } from '@supabase/supabase-js'

type Db = SupabaseClient

export type UpdateProfileDto = {
  full_name?: string
  phone?: string | null
  whatsapp?: string | null
  avatar_url?: string | null
  birth_date?: string | null
}

export const clientsRepo = {
  async listAll(db: Db) {
    return db
      .from('profiles')
      .select('*')
      .eq('role', 'client')
      .order('full_name')
  },

  async findById(db: Db, id: string) {
    return db.from('profiles').select('*').eq('id', id).single()
  },

  async findByRole(db: Db, id: string) {
    return db.from('profiles').select('role').eq('id', id).single()
  },

  async setActive(db: Db, id: string, isActive: boolean) {
    return db
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', id)
      .eq('role', 'client')
  },

  async updateNotes(db: Db, id: string, notes: string) {
    return db.from('profiles').update({ notes }).eq('id', id)
  },

  async updateProfile(db: Db, id: string, dto: UpdateProfileDto) {
    return db.from('profiles').update(dto).eq('id', id)
  },
} as const
