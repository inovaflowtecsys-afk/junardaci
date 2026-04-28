-- =============================================================
-- FIX: Dashboard não carrega tabelas por causa de RLS bloqueado
-- Execute este script no Supabase SQL Editor:
-- https://app.supabase.com/project/wmkkbmmebegmeiigrdtg/sql/new
-- =============================================================

-- CAUSA RAIZ:
-- A função current_clinica_id() faz subquery em "profissionais",
-- mas a policy "profissionais_select" só permite ler o próprio registro.
-- Resultado: profissionais NÃO-admin não conseguem ver dados das outras tabelas.
-- 
-- SOLUÇÃO: Garantir que current_profissional_id() e current_clinica_id()
-- são SECURITY DEFINER (bypassam RLS) e corrigir a policy de profissionais
-- para permitir que admins vejam todos os registros.

-- 1) Garante que as funções auxiliares bypassam RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.current_profissional_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT p.id
  FROM public.profissionais p
  WHERE p.auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_clinica_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'clinica_id', '')::uuid,
    (SELECT p.clinica_id
     FROM public.profissionais p
     WHERE p.auth_user_id = auth.uid()
     LIMIT 1),
    public.default_clinica_id()
  );
$$;

-- 2) Garante que is_admin_user também verifica a tabela profissionais
--    (útil quando app_metadata ainda não foi configurado)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'administrador'),
    false
  )
  OR EXISTS (
    SELECT 1 FROM public.profissionais p
    WHERE p.auth_user_id = auth.uid()
      AND p.role IN ('admin', 'administrador')
  );
$$;

-- 3) Corrige a policy de SELECT em profissionais:
--    Admins veem todos; profissionais veem apenas o próprio registro.
DROP POLICY IF EXISTS "profissionais_select" ON public.profissionais;
CREATE POLICY "profissionais_select" ON public.profissionais
FOR SELECT TO authenticated
USING (
  -- Próprio registro
  auth.uid() = auth_user_id
  OR
  -- Admin (via app_metadata)
  (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'administrador')
  OR
  -- Admin (via tabela profissionais — SECURITY DEFINER evita recursão)
  public.is_admin_user()
);

-- 4) Verifica se o usuário logado tem clinica_id mapeado corretamente
-- (rode para confirmar — deve retornar o UUID da clínica)
SELECT
  p.id,
  p.nome,
  p.role,
  p.clinica_id,
  p.auth_user_id,
  public.current_clinica_id() AS clinica_resolvida,
  public.is_admin_user() AS eh_admin
FROM public.profissionais p
WHERE p.auth_user_id = auth.uid();
