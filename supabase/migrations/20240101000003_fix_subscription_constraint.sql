-- ============================================================
-- Corrige a constraint errada em subscriptions
--
-- O UNIQUE em (client_id, status) impedia que um cliente
-- tivesse mais de uma assinatura cancelada/expirada, quebrando
-- clientes recorrentes. Substituído por índice parcial que
-- garante apenas 1 assinatura ACTIVE por cliente.
-- ============================================================

set search_path to extensions, public, auth;

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS one_active_subscription;

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_subscription_per_client
  ON public.subscriptions (client_id)
  WHERE status = 'active';
