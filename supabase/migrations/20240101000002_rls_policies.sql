-- ============================================================
-- MORIA BARBERSHOP — Row Level Security (RLS)
-- ============================================================

set search_path to extensions, public, auth;

-- Habilitar RLS em todas as tabelas
alter table public.profiles          enable row level security;
alter table public.plans             enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.barbers           enable row level security;
alter table public.services          enable row level security;
alter table public.appointments      enable row level security;
alter table public.appointment_services enable row level security;
alter table public.products          enable row level security;
alter table public.payments          enable row level security;
alter table public.blocked_slots     enable row level security;

-- ============================================================
-- FUNÇÕES AUXILIARES DE ROLE
-- ============================================================

create or replace function public.get_user_role()
returns user_role language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_barber()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('barber', 'admin')
  );
$$;

-- ============================================================
-- POLICIES: profiles
-- ============================================================

create policy "profiles: usuário vê o próprio perfil"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: admin vê todos"
  on public.profiles for select
  using (public.is_admin());

create policy "profiles: barbeiro vê clientes"
  on public.profiles for select
  using (public.is_barber());

create policy "profiles: usuário atualiza o próprio perfil"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "profiles: admin atualiza qualquer perfil"
  on public.profiles for update
  using (public.is_admin());

-- ============================================================
-- POLICIES: plans
-- ============================================================

create policy "plans: todos podem ver planos ativos"
  on public.plans for select
  using (is_active = true or public.is_admin());

create policy "plans: apenas admin gerencia planos"
  on public.plans for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- POLICIES: subscriptions
-- ============================================================

create policy "subscriptions: cliente vê a própria assinatura"
  on public.subscriptions for select
  using (client_id = auth.uid());

create policy "subscriptions: barbeiro vê assinaturas ativas"
  on public.subscriptions for select
  using (public.is_barber() and status = 'active');

create policy "subscriptions: admin vê todas"
  on public.subscriptions for select
  using (public.is_admin());

create policy "subscriptions: cliente cria assinatura"
  on public.subscriptions for insert
  with check (client_id = auth.uid());

create policy "subscriptions: cliente cancela própria assinatura"
  on public.subscriptions for update
  using (client_id = auth.uid())
  with check (client_id = auth.uid() and status = 'cancelled');

create policy "subscriptions: admin gerencia todas"
  on public.subscriptions for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- POLICIES: barbers
-- ============================================================

create policy "barbers: todos veem barbeiros ativos"
  on public.barbers for select
  using (is_active = true or public.is_admin() or id = auth.uid());

create policy "barbers: barbeiro atualiza próprio perfil"
  on public.barbers for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "barbers: admin gerencia todos"
  on public.barbers for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- POLICIES: services
-- ============================================================

create policy "services: todos veem serviços ativos"
  on public.services for select
  using (is_active = true or public.is_admin());

create policy "services: admin gerencia serviços"
  on public.services for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- POLICIES: appointments
-- ============================================================

create policy "appointments: cliente vê próprios agendamentos"
  on public.appointments for select
  using (client_id = auth.uid());

create policy "appointments: barbeiro vê agendamentos do dia"
  on public.appointments for select
  using (
    barber_id = auth.uid()
    or public.is_admin()
  );

create policy "appointments: cliente cria agendamento"
  on public.appointments for insert
  with check (client_id = auth.uid());

create policy "appointments: cliente cancela próprio agendamento"
  on public.appointments for update
  using (client_id = auth.uid() and status = 'scheduled')
  with check (client_id = auth.uid() and status = 'cancelled');

create policy "appointments: barbeiro atualiza agendamentos"
  on public.appointments for update
  using (barber_id = auth.uid() or public.is_admin())
  with check (barber_id = auth.uid() or public.is_admin());

create policy "appointments: admin gerencia todos"
  on public.appointments for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- POLICIES: appointment_services
-- ============================================================

create policy "appt_services: vê junto com agendamento"
  on public.appointment_services for select
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and (a.client_id = auth.uid() or a.barber_id = auth.uid() or public.is_admin())
    )
  );

create policy "appt_services: insere junto com agendamento"
  on public.appointment_services for insert
  with check (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and (a.client_id = auth.uid() or public.is_admin())
    )
  );

-- ============================================================
-- POLICIES: products
-- ============================================================

create policy "products: todos veem produtos ativos"
  on public.products for select
  using (is_active = true or public.is_admin());

create policy "products: admin gerencia produtos"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- POLICIES: payments
-- ============================================================

create policy "payments: cliente vê próprios pagamentos"
  on public.payments for select
  using (client_id = auth.uid());

create policy "payments: admin vê todos pagamentos"
  on public.payments for select
  using (public.is_admin());

create policy "payments: sistema cria pagamentos"
  on public.payments for insert
  with check (client_id = auth.uid() or public.is_admin());

create policy "payments: admin gerencia pagamentos"
  on public.payments for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- POLICIES: blocked_slots
-- ============================================================

create policy "blocked_slots: todos veem slots bloqueados"
  on public.blocked_slots for select
  to authenticated
  using (true);

create policy "blocked_slots: barbeiro gerencia próprios slots"
  on public.blocked_slots for all
  using (barber_id = auth.uid() or public.is_admin())
  with check (barber_id = auth.uid() or public.is_admin());

-- ============================================================
-- REALTIME: habilitar para tabelas dinâmicas
-- ============================================================

alter publication supabase_realtime add table public.appointments;
alter publication supabase_realtime add table public.blocked_slots;
