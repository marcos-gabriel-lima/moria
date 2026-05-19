-- ============================================================
-- SECURITY HARDENING — Funções RLS helper
-- ============================================================

-- Adiciona SET search_path às funções security definer
-- Previne search_path injection e alinha com recomendações do Supabase

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_barber()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('barber', 'admin')
  );
$$;

-- Revoga execução pública (qualquer role anônimo não deve chamar)
-- e re-autoriza apenas usuários autenticados (necessário para as RLS policies)
REVOKE ALL ON FUNCTION public.get_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin()       FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_barber()      FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin()       TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_barber()      TO authenticated;
