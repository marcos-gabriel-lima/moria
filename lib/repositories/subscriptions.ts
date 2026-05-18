import type { SupabaseClient } from '@supabase/supabase-js'
import type { PaymentMethod } from '@/types'

type Db = SupabaseClient

export type CreateSubscriptionDto = {
  client_id: string
  plan_id: string
  status: 'active'
  started_at: string
  expires_at: string
  auto_renew: boolean
  payment_method?: PaymentMethod
}

export const subscriptionsRepo = {
  async findActiveByClient(db: Db, clientId: string) {
    return db
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
  },

  async findByIdWithOwner(db: Db, id: string) {
    return db
      .from('subscriptions')
      .select('client_id, status')
      .eq('id', id)
      .single()
  },

  async findByQrToken(db: Db, token: string) {
    return db
      .from('subscriptions')
      .select('*, plan:plans(*), client:profiles(*)')
      .eq('qr_code_token', token)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
  },

  async listActivePlanIds(db: Db) {
    return db
      .from('subscriptions')
      .select('plan_id')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
  },

  async create(db: Db, dto: CreateSubscriptionDto) {
    return db
      .from('subscriptions')
      .insert(dto)
      .select('*, plan:plans(*)')
      .single()
  },

  async cancel(db: Db, id: string, reason: string) {
    return db
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason,
        auto_renew: false,
      })
      .eq('id', id)
  },
} as const
