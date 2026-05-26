-- ============================================================
-- RLS FIXES — 3 vulnerabilidades / inconsistencias
-- ============================================================
--
-- Resolve:
--   1. Cliente nao podia cancelar agendamento `confirmed` (apenas `scheduled`)
--      — action permitia, RLS bloqueava. Cliente ficava preso.
--
--   2. Barbeiro podia alterar `client_id`, `barber_id`, `scheduled_at`,
--      `total_price` de agendamentos via API direta. Defesa em profundidade
--      ausente — atacante autenticado (qualquer barber) podia mover horario
--      sem cliente saber, transferir agendamento pra outro barber, alterar
--      preco final, etc.
--
--   3. Cliente podia INSERT em `appointment_services` de agendamentos ja
--      `completed` ou `cancelled` — permitia inflar historico/relatorio
--      ou reivindicar servicos nao-cobertos retroativamente.
-- ============================================================

-- ── (1) appointments: cliente cancela confirmed/scheduled ──────────

drop policy if exists "appointments: cliente cancela próprio agendamento" on public.appointments;

create policy "appointments: cliente cancela próprio agendamento"
  on public.appointments for update
  using (
    client_id = auth.uid()
    and status in ('scheduled', 'confirmed')
  )
  with check (
    client_id = auth.uid()
    and status = 'cancelled'
  );

-- ── (2) appointments: trigger BEFORE UPDATE pra barbeiro ───────────
-- WITH CHECK não compara OLD vs NEW; usamos trigger pra forcar imutabilidade
-- das colunas criticas quando o ator NÃO é admin.

create or replace function public.prevent_barber_changing_critical_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admin pode tudo
  if public.is_admin() then
    return new;
  end if;

  -- Barbeiro (ou cliente, em outros code paths) NÃO pode alterar:
  if old.client_id is distinct from new.client_id then
    raise exception 'APPOINTMENT_CLIENT_LOCKED'
      using hint = 'O cliente do agendamento nao pode ser alterado.';
  end if;

  if old.barber_id is distinct from new.barber_id then
    raise exception 'APPOINTMENT_BARBER_LOCKED'
      using hint = 'O barbeiro do agendamento nao pode ser alterado por barber/cliente.';
  end if;

  if old.scheduled_at is distinct from new.scheduled_at then
    raise exception 'APPOINTMENT_SCHEDULE_LOCKED'
      using hint = 'O horario do agendamento nao pode ser alterado. Cancele e crie novo.';
  end if;

  -- total_price so muda na conclusao (pelo cliente que paga adicionais,
  -- nao via UPDATE direto pelo barbeiro)
  if old.total_price is distinct from new.total_price then
    raise exception 'APPOINTMENT_PRICE_LOCKED'
      using hint = 'O preco total nao pode ser alterado fora da finalizacao.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_appointments_prevent_critical_changes on public.appointments;

create trigger trg_appointments_prevent_critical_changes
  before update on public.appointments
  for each row execute function public.prevent_barber_changing_critical_fields();

revoke all on function public.prevent_barber_changing_critical_fields() from public;
revoke all on function public.prevent_barber_changing_critical_fields() from anon;
-- A trigger e executada pelo Postgres internamente; nao precisa GRANT EXECUTE.

-- ── (3) appointment_services: INSERT so em agendamentos abertos ─────

drop policy if exists "appt_services: insere junto com agendamento" on public.appointment_services;

create policy "appt_services: insere junto com agendamento"
  on public.appointment_services for insert
  with check (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and (a.client_id = auth.uid() or public.is_admin())
        -- Bloqueia INSERT retroativo em agendamentos finalizados
        and a.status in ('scheduled', 'confirmed', 'in_progress')
    )
  );
