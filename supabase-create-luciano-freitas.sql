begin;

create extension if not exists pgcrypto;

with created_user as (
  insert into auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values (
    gen_random_uuid(),
    'authenticated',
    'authenticated',
      'lucsilfreitas@gmail.com',
      crypt('0102adm', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"],"role":"admin","clinica_id":"00000000-0000-0000-0000-000000000001"}'::jsonb,
      '{"nome":"Luciano Freitas","role":"admin"}'::jsonb,
      now(),
      now()
  )
  on conflict (email) do update
    set encrypted_password = excluded.encrypted_password,
        email_confirmed_at = now(),
        raw_app_meta_data = excluded.raw_app_meta_data,
        raw_user_meta_data = excluded.raw_user_meta_data,
        updated_at = now()
  returning id, email
),
created_identity as (
  insert into auth.identities (
    id,
    user_id,
    provider,
    provider_id,
    identity_data,
    created_at,
    updated_at
  )
  select
    gen_random_uuid(),
    cu.id,
    'email',
    cu.id::text,
    jsonb_build_object('sub', cu.id::text, 'email', cu.email),
    now(),
    now()
  from created_user cu
  where not exists (
    select 1
    from auth.identities i
    where i.provider = 'email'
      and i.provider_id = cu.id::text
  )
  returning user_id
)
insert into public.profissionais (
  clinica_id,
  auth_user_id,
  nome,
  cpf,
  email,
  cargo_id,
  setor_id,
  especialidade_id,
  role,
  autoriza_cortesia,
  ativo
)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  cu.id,
  'Luciano Freitas',
  '038.523.677-86',
  cu.email,
  (select id from public.cargos where lower(nome) = 'gerente' limit 1),
  (select id from public.setores where lower(nome) = 'administrativo' limit 1),
  null,
  'admin',
  true,
  true
from created_user cu
on conflict (auth_user_id) do update
set nome = excluded.nome,
    cpf = excluded.cpf,
    email = excluded.email,
    cargo_id = excluded.cargo_id,
    setor_id = excluded.setor_id,
    especialidade_id = excluded.especialidade_id,
    role = excluded.role,
    autoriza_cortesia = excluded.autoriza_cortesia,
    ativo = excluded.ativo,
    updated_at = now();

commit;
