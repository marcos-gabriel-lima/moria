import type { SupabaseClient } from '@supabase/supabase-js'
import type { PaymentMethod } from '@/types'
import { generateQRToken } from '@/lib/qr-token'

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

export type ActivateSubscriptionDto = {
  started_at: string
  expires_at: string
  payment_method: PaymentMethod
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
    // Geramos token explícito (não dependemos do DEFAULT do BD) pra garantir
    // que toda assinatura ativa tem um QR token criptograficamente seguro.
    return db
      .from('subscriptions')
      .insert({ ...dto, qr_code_token: generateQRToken() })
      .select('*, plan:plans(*)')
      .single()
  },

  async listPending(db: Db) {
    return db
      .from('subscriptions')
      .select('id, created_at, plan:plans(id, name, price), client:profiles(id, full_name, phone, whatsapp)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
  },

  async activate(db: Db, id: string, dto: ActivateSubscriptionDto) {
    // Rotacionamos o token de QR ao ativar — defesa contra vazamento de token
    // anterior (foto da carteira, screenshot etc.) e contra reativação de uma
    // pending que teve seu token original divulgado.
    return db
      .from('subscriptions')
      .update({ status: 'active', qr_code_token: generateQRToken(), ...dto })
      .eq('id', id)
      .eq('status', 'pending')
      .select('*, plan:plans(*), client:profiles(*)')
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
