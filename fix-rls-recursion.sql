-- Este SQL resolve o erro "stack depth limit exceeded" 
-- Executa no Supabase SQL Editor: https://app.supabase.com/project/[seu-projeto]/sql/new

create or replace function public.current_profissional_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select p.id
  from public.profissionais p
  where p.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_clinica_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'clinica_id', '')::uuid,
    (select p.clinica_id
     from public.profissionais p
     where p.auth_user_id = auth.uid()
     limit 1),
    public.default_clinica_id()
  );
$$;
