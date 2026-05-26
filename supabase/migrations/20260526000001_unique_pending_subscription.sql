-- ============================================================
-- UNIQUE PENDING SUBSCRIPTION PER CLIENT
-- ============================================================
--
-- Antes: nada impedia cliente acumular varias solicitacoes pending.
-- Cliente clicando "Assinar" 100x criava 100 pendings, spammava o
-- painel admin e gerava risco de admin ativar duas e cobrar duplicado.
--
-- Solucao: partial unique index. INSERT de uma segunda pending pro
-- mesmo cliente falha com violacao de constraint (codigo Postgres 23505).
-- A action `subscribeToPlan` faz um pre-check em JS pra dar mensagem
-- amigavel; este index e a defesa em profundidade.
-- ============================================================

create unique index if not exists subscriptions_one_pending_per_client
  on public.subscriptions (client_id)
  where status = 'pending';
