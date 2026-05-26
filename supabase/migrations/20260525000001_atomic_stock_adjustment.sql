-- ============================================================
-- Stock adjustment atômico
-- ============================================================
-- Substitui o read-then-write em JS (que tinha race condition)
-- por um UPDATE atômico — o Postgres garante que múltiplas chamadas
-- concorrentes serializam corretamente sem perda de decrementos.
--
-- Contrato:
--   - p_delta positivo: incrementa estoque
--   - p_delta negativo: decrementa estoque (clamp em 0, NÃO permite negativo)
--   - retorna o novo estoque após o ajuste
--   - lança 'PRODUCT_NOT_FOUND' se o produto não existir
-- ============================================================

create or replace function public.adjust_product_stock(
  p_id uuid,
  p_delta integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_stock integer;
begin
  update public.products
  set stock = greatest(0, stock + p_delta)
  where id = p_id
  returning stock into v_new_stock;

  if v_new_stock is null then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;

  return v_new_stock;
end;
$$;

-- Bloqueia execução por anônimos; só admin/barbeiro autenticado.
-- A action `adjustStock` já faz requireAdmin(); a RPC roda como SECURITY DEFINER
-- então o GRANT é pra qualquer authenticated (auth check é em camada superior).
revoke all on function public.adjust_product_stock(uuid, integer) from public;
revoke all on function public.adjust_product_stock(uuid, integer) from anon;
grant execute on function public.adjust_product_stock(uuid, integer) to authenticated;
