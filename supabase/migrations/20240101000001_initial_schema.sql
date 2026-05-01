-- ============================================================
-- MORIA BARBERSHOP — Schema Completo
-- ============================================================

-- Extensões necessárias
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('client', 'barber', 'admin');
create type subscription_status as enum ('active', 'cancelled', 'expired', 'pending');
create type appointment_status as enum ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
create type payment_method as enum ('pix', 'credit_card', 'debit_card', 'cash', 'plan');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type service_category as enum ('haircut', 'beard', 'combo', 'treatment', 'other');

-- ============================================================
-- TABELA: profiles
-- Extende auth.users do Supabase
-- ============================================================

create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  full_name     text not null,
  phone         text,
  avatar_url    text,
  role          user_role not null default 'client',
  whatsapp      text,
  birth_date    date,
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'Perfis de usuários — clientes, barbeiros e admins';

-- ============================================================
-- TABELA: plans
-- Planos de assinatura disponíveis
-- ============================================================

create table public.plans (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text not null unique,
  description   text,
  price         numeric(10,2) not null,
  includes_cut  boolean not null default false,
  includes_beard boolean not null default false,
  max_cuts_per_month   integer,   -- null = ilimitado
  max_beards_per_month integer,   -- null = ilimitado
  features      text[] not null default '{}',
  is_active     boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.plans is 'Planos de assinatura da barbearia';

-- ============================================================
-- TABELA: subscriptions
-- Assinaturas ativas dos clientes
-- ============================================================

create table public.subscriptions (
  id                uuid primary key default uuid_generate_v4(),
  client_id         uuid not null references public.profiles(id) on delete cascade,
  plan_id           uuid not null references public.plans(id),
  status            subscription_status not null default 'pending',
  started_at        timestamptz,
  expires_at        timestamptz,
  cancelled_at      timestamptz,
  cancel_reason     text,
  qr_code_token     text unique default encode(gen_random_bytes(32), 'hex'),
  payment_method    payment_method,
  external_id       text,  -- ID no gateway de pagamento
  auto_renew        boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint one_active_subscription
    unique nulls not distinct (client_id, status)
    -- Garante apenas 1 assinatura ativa por cliente via trigger
);

comment on table public.subscriptions is 'Assinaturas dos clientes';

-- ============================================================
-- TABELA: barbers
-- Dados específicos de barbeiros
-- ============================================================

create table public.barbers (
  id              uuid primary key references public.profiles(id) on delete cascade,
  specialty       text[],
  bio             text,
  instagram       text,
  commission_rate numeric(5,2) not null default 50.00,
  works_monday    boolean not null default true,
  works_tuesday   boolean not null default true,
  works_wednesday boolean not null default true,
  works_thursday  boolean not null default true,
  works_friday    boolean not null default true,
  works_saturday  boolean not null default true,
  works_sunday    boolean not null default false,
  start_time      time not null default '08:00',
  end_time        time not null default '18:00',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

comment on table public.barbers is 'Dados adicionais dos barbeiros';

-- ============================================================
-- TABELA: services
-- Catálogo de serviços
-- ============================================================

create table public.services (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  description     text,
  category        service_category not null,
  duration_minutes integer not null default 30,
  price           numeric(10,2) not null,
  covered_by_cut  boolean not null default false,
  covered_by_beard boolean not null default false,
  is_active       boolean not null default true,
  display_order   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.services is 'Catálogo de serviços oferecidos';

-- ============================================================
-- TABELA: appointments
-- Agendamentos
-- ============================================================

create table public.appointments (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references public.profiles(id) on delete cascade,
  barber_id       uuid not null references public.barbers(id),
  subscription_id uuid references public.subscriptions(id),
  status          appointment_status not null default 'scheduled',
  scheduled_at    timestamptz not null,
  duration_minutes integer not null default 30,
  notes           text,
  is_subscriber   boolean not null default false,
  checked_in_at   timestamptz,
  completed_at    timestamptz,
  cancelled_at    timestamptz,
  cancel_reason   text,
  total_price     numeric(10,2) not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.appointments is 'Agendamentos da barbearia';

-- ============================================================
-- TABELA: appointment_services
-- Serviços incluídos em cada agendamento
-- ============================================================

create table public.appointment_services (
  id             uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id     uuid not null references public.services(id),
  price          numeric(10,2) not null,
  covered_by_plan boolean not null default false,
  created_at     timestamptz not null default now()
);

comment on table public.appointment_services is 'Serviços vinculados a cada agendamento';

-- ============================================================
-- TABELA: products
-- Produtos à venda
-- ============================================================

create table public.products (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  description     text,
  price           numeric(10,2) not null,
  stock           integer not null default 0,
  image_url       text,
  category        text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.products is 'Produtos disponíveis para venda';

-- ============================================================
-- TABELA: payments
-- Registro financeiro de pagamentos
-- ============================================================

create table public.payments (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references public.profiles(id),
  appointment_id  uuid references public.appointments(id),
  subscription_id uuid references public.subscriptions(id),
  amount          numeric(10,2) not null,
  method          payment_method not null,
  status          payment_status not null default 'pending',
  external_id     text,  -- ID no gateway (Mercado Pago, Stripe, etc.)
  pix_key         text,
  pix_qr_code     text,
  paid_at         timestamptz,
  refunded_at     timestamptz,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.payments is 'Histórico financeiro de pagamentos';

-- ============================================================
-- TABELA: blocked_slots
-- Horários bloqueados pelos barbeiros
-- ============================================================

create table public.blocked_slots (
  id          uuid primary key default uuid_generate_v4(),
  barber_id   uuid not null references public.barbers(id) on delete cascade,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  reason      text,
  created_at  timestamptz not null default now(),

  constraint valid_range check (ends_at > starts_at)
);

comment on table public.blocked_slots is 'Horários bloqueados / férias dos barbeiros';

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================

create index idx_appointments_barber_date    on public.appointments(barber_id, scheduled_at);
create index idx_appointments_client         on public.appointments(client_id);
create index idx_appointments_status         on public.appointments(status);
create index idx_appointments_scheduled_at   on public.appointments(scheduled_at);
create index idx_subscriptions_client        on public.subscriptions(client_id);
create index idx_subscriptions_status        on public.subscriptions(status);
create index idx_subscriptions_qr            on public.subscriptions(qr_code_token);
create index idx_payments_client             on public.payments(client_id);
create index idx_blocked_slots_barber        on public.blocked_slots(barber_id, starts_at, ends_at);

-- ============================================================
-- FUNÇÃO: updated_at automático
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger trg_plans_updated_at
  before update on public.plans
  for each row execute function public.handle_updated_at();

create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();

create trigger trg_services_updated_at
  before update on public.services
  for each row execute function public.handle_updated_at();

create trigger trg_appointments_updated_at
  before update on public.appointments
  for each row execute function public.handle_updated_at();

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.handle_updated_at();

-- ============================================================
-- FUNÇÃO: criar profile automaticamente no signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- FUNÇÃO: validar limite de 48h para não-assinantes
-- ============================================================

create or replace function public.validate_appointment_booking()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_has_active_subscription boolean;
  v_hours_until_appointment  numeric;
begin
  -- Não valida alterações de status (só novas reservas)
  if tg_op = 'UPDATE' and old.scheduled_at = new.scheduled_at then
    return new;
  end if;

  -- Não agendamentos no passado
  if new.scheduled_at < now() then
    raise exception 'Não é possível agendar em horários passados';
  end if;

  -- Verificar se tem assinatura ativa
  select exists (
    select 1 from public.subscriptions
    where client_id = new.client_id
      and status = 'active'
      and expires_at > now()
  ) into v_has_active_subscription;

  -- Assinantes têm prioridade: podem agendar com qualquer antecedência
  if v_has_active_subscription then
    new.is_subscriber := true;
    return new;
  end if;

  -- Não-assinantes: máximo 48h de antecedência
  v_hours_until_appointment := extract(epoch from (new.scheduled_at - now())) / 3600;

  if v_hours_until_appointment > 48 then
    raise exception 'BOOKING_TOO_FAR_AHEAD: Não-assinantes só podem agendar com até 48h de antecedência. Assine um plano para agendar com mais antecedência.';
  end if;

  new.is_subscriber := false;
  return new;
end;
$$;

create trigger trg_validate_appointment_booking
  before insert or update on public.appointments
  for each row execute function public.validate_appointment_booking();

-- ============================================================
-- FUNÇÃO: verificar conflito de horário
-- ============================================================

create or replace function public.check_slot_conflict()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_conflict_count integer;
begin
  if new.status in ('cancelled', 'no_show') then
    return new;
  end if;

  select count(*) into v_conflict_count
  from public.appointments
  where barber_id = new.barber_id
    and id != new.id
    and status not in ('cancelled', 'no_show')
    and tstzrange(scheduled_at, scheduled_at + (duration_minutes || ' minutes')::interval)
      && tstzrange(new.scheduled_at, new.scheduled_at + (new.duration_minutes || ' minutes')::interval);

  if v_conflict_count > 0 then
    raise exception 'SLOT_CONFLICT: Horário já está ocupado para este barbeiro';
  end if;

  -- Verificar blocked_slots
  select count(*) into v_conflict_count
  from public.blocked_slots
  where barber_id = new.barber_id
    and tstzrange(starts_at, ends_at)
      && tstzrange(new.scheduled_at, new.scheduled_at + (new.duration_minutes || ' minutes')::interval);

  if v_conflict_count > 0 then
    raise exception 'SLOT_BLOCKED: Horário bloqueado pelo barbeiro';
  end if;

  return new;
end;
$$;

create trigger trg_check_slot_conflict
  before insert or update on public.appointments
  for each row execute function public.check_slot_conflict();

-- ============================================================
-- FUNÇÃO: apenas 1 assinatura ativa por cliente
-- ============================================================

create or replace function public.check_single_active_subscription()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'active' then
    update public.subscriptions
    set status = 'cancelled',
        cancelled_at = now(),
        cancel_reason = 'Substituída por nova assinatura'
    where client_id = new.client_id
      and id != new.id
      and status = 'active';
  end if;
  return new;
end;
$$;

create trigger trg_single_active_subscription
  before insert or update on public.subscriptions
  for each row execute function public.check_single_active_subscription();
