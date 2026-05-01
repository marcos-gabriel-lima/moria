-- ============================================================
-- MORIA BARBERSHOP — Dados Iniciais
-- ============================================================

-- Planos de assinatura
insert into public.plans (name, slug, description, price, includes_cut, includes_beard, features, display_order) values
(
  'Corte Ilimitado',
  'corte-ilimitado',
  'Cortes ilimitados todo mês. Agende quando quiser, sem limites.',
  150.00,
  true,
  false,
  array[
    'Cortes ilimitados',
    'Prioridade no agendamento',
    'Agendamento com qualquer antecedência',
    'Carteira digital exclusiva'
  ],
  1
),
(
  'Barba Ilimitada',
  'barba-ilimitada',
  'Barbas ilimitadas todo mês. Mantenha sempre o visual impecável.',
  89.00,
  false,
  true,
  array[
    'Barbas ilimitadas',
    'Prioridade no agendamento',
    'Agendamento com qualquer antecedência',
    'Carteira digital exclusiva'
  ],
  2
),
(
  'Corte + Barba Ilimitado',
  'corte-barba-ilimitado',
  'O pacote completo. Corte e barba ilimitados todo mês.',
  199.00,
  true,
  true,
  array[
    'Cortes ilimitados',
    'Barbas ilimitadas',
    'Prioridade máxima no agendamento',
    'Agendamento com qualquer antecedência',
    'Carteira digital exclusiva',
    'Desconto em produtos'
  ],
  3
);

-- Serviços do catálogo
insert into public.services (name, description, category, duration_minutes, price, covered_by_cut, covered_by_beard, display_order) values
('Corte Social',         'Corte clássico com acabamento perfeito',             'haircut',   30,  35.00, true,  false, 1),
('Corte Degradê',        'Degradê preciso e moderno',                           'haircut',   40,  40.00, true,  false, 2),
('Corte Navalhado',      'Corte com navalha para acabamento diferenciado',      'haircut',   45,  45.00, true,  false, 3),
('Barba Completa',       'Barba feita com navalha, toalha quente e hidratação', 'beard',     30,  35.00, false, true,  4),
('Barba Simples',        'Aparar e modelar a barba',                            'beard',     20,  25.00, false, true,  5),
('Corte + Barba',        'Combo completo corte e barba',                        'combo',     60,  65.00, true,  true,  6),
('Pigmentação',          'Pigmentação para cabelo ou barba',                    'treatment', 30,  50.00, false, false, 7),
('Hidratação Capilar',   'Tratamento intensivo para cabelo e couro cabeludo',   'treatment', 30,  45.00, false, false, 8),
('Sobrancelha',          'Design e modelagem de sobrancelha',                   'other',     15,  20.00, false, false, 9);
