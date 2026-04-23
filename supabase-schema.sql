begin;

create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.default_clinica_id()
returns uuid
language sql
stable
as $$
  select '00000000-0000-0000-0000-000000000001'::uuid;
$$;

create table public.clinicas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.setores (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.cargos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.especialidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativa boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.formas_pagamento (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.unidades_medida (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.profissionais (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas (id) on delete restrict,
  auth_user_id uuid unique references auth.users (id) on delete set null,
  nome text not null,
  cpf text unique,
  data_nascimento date,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  uf text,
  telefone text,
  email text,
  avatar_url text,
  cargo_id uuid references public.cargos (id) on delete set null,
  setor_id uuid references public.setores (id) on delete set null,
  especialidade_id uuid references public.especialidades (id) on delete set null,
  role text not null default 'profissional' check (role in ('admin', 'administrador', 'profissional')),
  autoriza_cortesia boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas (id) on delete restrict,
  nome text not null,
  cpf text not null unique,
  data_nascimento date,
  sexo text,
  estado_civil text,
  profissao text,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  uf text,
  telefone text,
  email text,
  indicado_por text,
  contato_emergencia_nome text,
  contato_emergencia_telefone text,
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.anamneses (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas (id) on delete restrict,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  nome_arquivo text not null,
  data_adicao timestamptz not null default timezone('utc', now()),
  url_arquivo text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas (id) on delete restrict,
  tipo_pessoa text not null check (tipo_pessoa in ('PF', 'PJ')),
  razao_social text not null,
  nome_fantasia text,
  cpf_cnpj text not null unique,
  ie text,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  uf text,
  contato text,
  telefone text,
  email text,
  site text,
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas (id) on delete restrict,
  nome text not null,
  marca text,
  unidade text not null,
  qtd_minima numeric(12, 3) not null default 0,
  qtd_maxima numeric(12, 3),
  fornecedor_id uuid references public.fornecedores (id) on delete set null,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.tratamentos (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas (id) on delete restrict,
  nome text not null,
  descricao text,
  valor numeric(12, 2) not null default 0,
  perc_max_desconto numeric(5, 2) not null default 0,
  duracao_estimada integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.atendimentos (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas (id) on delete restrict,
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  tratamento_id uuid not null references public.tratamentos (id) on delete restrict,
  profissional_id uuid not null references public.profissionais (id) on delete restrict,
  valor_tratamento numeric(12, 2) not null default 0,
  desconto_valor numeric(12, 2) not null default 0,
  desconto_responsavel text,
  desconto_motivo text,
  valor_final numeric(12, 2) generated always as (greatest(valor_tratamento - desconto_valor, 0)) stored,
  status text not null default 'ORCAMENTO' check (status in ('ORCAMENTO', 'EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO')),
  data_inicio timestamptz,
  data_fim timestamptz,
  cancelamento_responsavel text,
  cancelamento_motivo text,
  data_cancelamento timestamptz,
  observacoes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.prontuarios (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas (id) on delete restrict,
  atendimento_id uuid not null references public.atendimentos (id) on delete cascade,
  data_registro timestamptz not null default timezone('utc', now()),
  responsavel_id uuid not null references public.profissionais (id) on delete restrict,
  tipo text not null default 'RECOMENDACAO' check (tipo in ('RECOMENDACAO', 'MEDICAMENTO', 'EXAME')),
  descricao text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.prontuarios_anexos (
  id uuid primary key default gen_random_uuid(),
  prontuario_id uuid not null references public.prontuarios (id) on delete cascade,
  nome_arquivo text not null,
  data_upload timestamptz not null default timezone('utc', now()),
  url text not null,
  mime_type text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.estoque_movimentacoes (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas (id) on delete restrict,
  produto_id uuid not null references public.produtos (id) on delete restrict,
  tipo text not null check (tipo in ('ENTRADA', 'SAIDA')),
  operacao text not null check (operacao in ('COMPRA', 'DEVOLUCAO', 'ATENDIMENTO', 'SAIDA_MANUAL', 'AJUSTE', 'ESTORNO', 'SALDO_INICIAL')),
  quantidade numeric(12, 3) not null,
  valor_unitario numeric(12, 2) not null default 0,
  fornecedor_id uuid references public.fornecedores (id) on delete set null,
  atendimento_id uuid references public.atendimentos (id) on delete set null,
  profissional_id uuid references public.profissionais (id) on delete set null,
  data_movimentacao timestamptz not null default timezone('utc', now()),
  observacoes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.atendimento_produtos (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas (id) on delete restrict,
  atendimento_id uuid not null references public.atendimentos (id) on delete cascade,
  produto_id uuid not null references public.produtos (id) on delete restrict,
  quantidade numeric(12, 3) not null,
  valor_unitario numeric(12, 2) not null default 0,
  estoque_movimentacao_id uuid unique references public.estoque_movimentacoes (id) on delete set null,
  responsavel_id uuid not null references public.profissionais (id) on delete restrict,
  observacoes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas (id) on delete restrict,
  atendimento_id uuid not null references public.atendimentos (id) on delete cascade,
  forma_pagamento_id uuid not null references public.formas_pagamento (id) on delete restrict,
  valor numeric(12, 2) not null,
  data_pagamento timestamptz not null default timezone('utc', now()),
  observacoes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

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

create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create or replace function public.can_access_clinica(target_clinica_id uuid)
returns boolean
language sql
stable
as $$
  select public.is_admin_user() or target_clinica_id = public.current_clinica_id();
$$;

create or replace function public.assign_clinica_id()
returns trigger
language plpgsql
as $$
begin
  new.clinica_id := coalesce(new.clinica_id, public.current_clinica_id());
  return new;
end;
$$;

create or replace function public.get_produto_saldo(p_produto_id uuid)
returns numeric
language sql
stable
as $$
  select coalesce(sum(
    case
      when m.tipo = 'ENTRADA' then m.quantidade
      else -m.quantidade
    end
  ), 0)
  from public.estoque_movimentacoes m
  where m.produto_id = p_produto_id;
$$;

create or replace function public.get_produto_custo_medio(p_produto_id uuid)
returns numeric
language sql
stable
as $$
  select coalesce(
    sum(
      case when m.tipo = 'ENTRADA' then m.quantidade * m.valor_unitario else 0 end
    ) / nullif(
      sum(case when m.tipo = 'ENTRADA' then m.quantidade else 0 end),
      0
    ),
    0
  )
  from public.estoque_movimentacoes m
  where m.produto_id = p_produto_id;
$$;

create or replace function public.validate_profissional()
returns trigger
language plpgsql
as $$
declare
  cargo_nome text;
begin
  new.clinica_id := coalesce(new.clinica_id, public.current_clinica_id());

  if new.email is not null then
    new.email = lower(trim(new.email));
  end if;

  if new.role is null then
    new.role = 'profissional';
  end if;

  if new.cargo_id is not null then
    select c.nome into cargo_nome
    from public.cargos c
    where c.id = new.cargo_id;

    if cargo_nome is null then
      raise exception 'Cargo informado nao existe.';
    end if;

    if lower(cargo_nome) in ('médico', 'medico') and new.especialidade_id is null then
      raise exception 'Profissional com cargo Medico precisa de especialidade.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.validate_estoque_movimentacao()
returns trigger
language plpgsql
as $$
declare
  saldo_atual numeric;
begin
  new.clinica_id := coalesce(new.clinica_id, public.current_clinica_id());

  if new.quantidade <= 0 then
    raise exception 'Quantidade deve ser maior que zero.';
  end if;

  if new.tipo not in ('ENTRADA', 'SAIDA') then
    raise exception 'Tipo de estoque invalido.';
  end if;

  if new.tipo = 'ENTRADA' and new.operacao = 'COMPRA' and new.fornecedor_id is null then
    raise exception 'Fornecedor e obrigatorio em compras.';
  end if;

  if new.operacao = 'ATENDIMENTO' and new.atendimento_id is null then
    raise exception 'Atendimento e obrigatorio na baixa por atendimento.';
  end if;

  if new.operacao in ('ATENDIMENTO', 'SAIDA_MANUAL') and new.profissional_id is null then
    raise exception 'Profissional responsavel e obrigatorio.';
  end if;

  if new.tipo = 'SAIDA' then
    saldo_atual := public.get_produto_saldo(new.produto_id);
    if new.quantidade > saldo_atual then
      raise exception 'Quantidade maior que o saldo em estoque.';
    end if;
    new.valor_unitario := coalesce(nullif(new.valor_unitario, 0), public.get_produto_custo_medio(new.produto_id));
  end if;

  if new.tipo = 'ENTRADA' then
    new.valor_unitario := coalesce(nullif(new.valor_unitario, 0), 0);
  end if;

  return new;
end;
$$;

create or replace function public.validate_atendimento()
returns trigger
language plpgsql
as $$
declare
  is_new boolean := (tg_op = 'INSERT');
  tratamento_valor numeric;
  desconto_max_percent numeric;
  total_prontuarios integer;
  total_pago numeric;
begin
  new.clinica_id := coalesce(new.clinica_id, public.current_clinica_id());

  if new.desconto_valor is null then
    new.desconto_valor := 0;
  end if;

  if new.tratamento_id is not null then
    select t.valor, t.perc_max_desconto
      into tratamento_valor, desconto_max_percent
    from public.tratamentos t
    where t.id = new.tratamento_id;

    if tratamento_valor is null then
      raise exception 'Tratamento informado nao existe.';
    end if;

    if new.valor_tratamento is null or new.valor_tratamento <= 0 then
      new.valor_tratamento := tratamento_valor;
    end if;

    if new.desconto_valor > (tratamento_valor * desconto_max_percent / 100) then
      raise exception 'Desconto acima do permitido para este tratamento.';
    end if;
  end if;

  if new.status = 'EM_ANDAMENTO' then
    if is_new or old.status is distinct from new.status then
      new.data_inicio := coalesce(new.data_inicio, timezone('utc', now()));
    end if;
  end if;

  if new.status = 'FINALIZADO' then
    if not is_new and old.status is not distinct from new.status then
      return new;
    end if;

    select count(*)
      into total_prontuarios
    from public.prontuarios p
    where p.atendimento_id = new.id;

    if total_prontuarios = 0 then
      raise exception 'Nao e possivel finalizar sem ao menos 1 prontuario.';
    end if;

    select coalesce(sum(pg.valor), 0)
      into total_pago
    from public.pagamentos pg
    where pg.atendimento_id = new.id;

    if total_pago < coalesce(new.valor_final, 0) then
      raise exception 'Nao e possivel finalizar com pagamento pendente.';
    end if;

    new.data_fim := coalesce(new.data_fim, timezone('utc', now()));
  end if;

  if new.status = 'CANCELADO' then
    if is_new or old.status is distinct from new.status then
      new.data_cancelamento := coalesce(new.data_cancelamento, timezone('utc', now()));
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.validate_prontuario()
returns trigger
language plpgsql
as $$
declare
  status_atendimento text;
begin
  new.clinica_id := coalesce(new.clinica_id, public.current_clinica_id());

  select a.status
    into status_atendimento
  from public.atendimentos a
  where a.id = new.atendimento_id;

  if status_atendimento is null then
    raise exception 'Atendimento informado nao existe.';
  end if;

  if status_atendimento <> 'EM_ANDAMENTO' then
    raise exception 'Prontuário só pode ser incluído com atendimento EM ANDAMENTO.';
  end if;

  new.data_registro := coalesce(new.data_registro, timezone('utc', now()));
  return new;
end;
$$;

create or replace function public.validate_pagamento()
returns trigger
language plpgsql
as $$
declare
  total_pago numeric;
  valor_final_atendimento numeric;
begin
  new.clinica_id := coalesce(new.clinica_id, public.current_clinica_id());

  if new.valor <= 0 then
    raise exception 'Valor do pagamento deve ser maior que zero.';
  end if;

  select a.valor_final
    into valor_final_atendimento
  from public.atendimentos a
  where a.id = new.atendimento_id;

  if valor_final_atendimento is null then
    raise exception 'Atendimento informado nao existe.';
  end if;

  select coalesce(sum(p.valor), 0)
    into total_pago
  from public.pagamentos p
  where p.atendimento_id = new.atendimento_id
    and p.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if total_pago + coalesce(new.valor, 0) > valor_final_atendimento then
    raise exception 'Soma dos pagamentos nao pode exceder o valor final do atendimento.';
  end if;

  new.data_pagamento := coalesce(new.data_pagamento, timezone('utc', now()));
  return new;
end;
$$;

create or replace function public.handle_atendimento_cancelado()
returns trigger
language plpgsql
as $$
begin
  if old.status is distinct from new.status and new.status = 'CANCELADO' then
    delete from public.pagamentos
    where atendimento_id = new.id;

    insert into public.estoque_movimentacoes (
      clinica_id,
      produto_id,
      tipo,
      operacao,
      quantidade,
      valor_unitario,
      atendimento_id,
      profissional_id,
      observacoes
    )
    select
      ap.clinica_id,
      ap.produto_id,
      'ENTRADA',
      'ESTORNO',
      ap.quantidade,
      ap.valor_unitario,
      ap.atendimento_id,
      ap.responsavel_id,
      'Estorno automatico por cancelamento de atendimento'
    from public.atendimento_produtos ap
    where ap.atendimento_id = new.id;
  end if;

  return new;
end;
$$;

create or replace function public.before_insert_atendimento_produto()
returns trigger
language plpgsql
as $$
declare
  atendimento_status text;
  movimento_id uuid;
begin
  new.clinica_id := coalesce(new.clinica_id, public.current_clinica_id());

  if new.quantidade <= 0 then
    raise exception 'Quantidade deve ser maior que zero.';
  end if;

  select a.status
    into atendimento_status
  from public.atendimentos a
  where a.id = new.atendimento_id;

  if atendimento_status is null then
    raise exception 'Atendimento informado nao existe.';
  end if;

  if atendimento_status <> 'EM_ANDAMENTO' then
    raise exception 'Produtos so podem ser lancados com atendimento EM_ANDAMENTO.';
  end if;

  new.valor_unitario := coalesce(nullif(new.valor_unitario, 0), public.get_produto_custo_medio(new.produto_id));

  insert into public.estoque_movimentacoes (
    clinica_id,
    produto_id,
    tipo,
    operacao,
    quantidade,
    valor_unitario,
    atendimento_id,
    profissional_id,
    observacoes
  )
  values (
    coalesce(new.clinica_id, public.default_clinica_id()),
    new.produto_id,
    'SAIDA',
    'ATENDIMENTO',
    new.quantidade,
    new.valor_unitario,
    new.atendimento_id,
    new.responsavel_id,
    coalesce(new.observacoes, 'Baixa direta por atendimento')
  )
  returning id into movimento_id;

  new.estoque_movimentacao_id := movimento_id;
  new.clinica_id := coalesce(new.clinica_id, public.default_clinica_id());
  return new;
end;
$$;

create trigger trg_profissionais_updated_at
before update on public.profissionais
for each row execute function public.touch_updated_at();

create trigger trg_clientes_updated_at
before update on public.clientes
for each row execute function public.touch_updated_at();

create trigger trg_anamneses_updated_at
before update on public.anamneses
for each row execute function public.touch_updated_at();

create trigger trg_fornecedores_updated_at
before update on public.fornecedores
for each row execute function public.touch_updated_at();

create trigger trg_produtos_updated_at
before update on public.produtos
for each row execute function public.touch_updated_at();

create trigger trg_tratamentos_updated_at
before update on public.tratamentos
for each row execute function public.touch_updated_at();

create trigger trg_atendimentos_updated_at
before update on public.atendimentos
for each row execute function public.touch_updated_at();

create trigger trg_prontuarios_updated_at
before update on public.prontuarios
for each row execute function public.touch_updated_at();

create trigger trg_prontuarios_anexos_updated_at
before update on public.prontuarios_anexos
for each row execute function public.touch_updated_at();

create trigger trg_estoque_movimentacoes_updated_at
before update on public.estoque_movimentacoes
for each row execute function public.touch_updated_at();

create trigger trg_atendimento_produtos_updated_at
before update on public.atendimento_produtos
for each row execute function public.touch_updated_at();

create trigger trg_pagamentos_updated_at
before update on public.pagamentos
for each row execute function public.touch_updated_at();

create trigger trg_validate_profissionais
before insert or update on public.profissionais
for each row execute function public.validate_profissional();

create trigger trg_assign_clientes_clinica
before insert on public.clientes
for each row execute function public.assign_clinica_id();

create trigger trg_assign_fornecedores_clinica
before insert on public.fornecedores
for each row execute function public.assign_clinica_id();

create trigger trg_assign_produtos_clinica
before insert on public.produtos
for each row execute function public.assign_clinica_id();

create trigger trg_assign_tratamentos_clinica
before insert on public.tratamentos
for each row execute function public.assign_clinica_id();

create trigger trg_assign_anamneses_clinica
before insert on public.anamneses
for each row execute function public.assign_clinica_id();

create trigger trg_validate_estoque_movimentacao
before insert or update on public.estoque_movimentacoes
for each row execute function public.validate_estoque_movimentacao();

create trigger trg_validate_atendimento
before insert or update on public.atendimentos
for each row execute function public.validate_atendimento();

create trigger trg_validate_prontuario
before insert on public.prontuarios
for each row execute function public.validate_prontuario();

create trigger trg_validate_pagamento
before insert or update on public.pagamentos
for each row execute function public.validate_pagamento();

create trigger trg_atendimento_cancelado
after update of status on public.atendimentos
for each row execute function public.handle_atendimento_cancelado();

create trigger trg_atendimento_produto_bi
before insert on public.atendimento_produtos
for each row execute function public.before_insert_atendimento_produto();

insert into public.clinicas (id, nome, ativo)
values ('00000000-0000-0000-0000-000000000001', 'Clínica Principal', true)
on conflict (id) do nothing;

insert into public.setores (id, nome, ativo) values
  ('10000000-0000-0000-0000-000000000001', 'Clínico', true),
  ('10000000-0000-0000-0000-000000000002', 'Estético', true),
  ('10000000-0000-0000-0000-000000000003', 'Comercial', true),
  ('10000000-0000-0000-0000-000000000004', 'Administrativo', true)
on conflict (id) do nothing;

insert into public.cargos (id, nome, ativo) values
  ('20000000-0000-0000-0000-000000000001', 'Médico', true),
  ('20000000-0000-0000-0000-000000000002', 'Biomédico', true),
  ('20000000-0000-0000-0000-000000000003', 'Fisioterapeuta', true),
  ('20000000-0000-0000-0000-000000000004', 'Recepcionista', true),
  ('20000000-0000-0000-0000-000000000005', 'Gerente', true)
on conflict (id) do nothing;

insert into public.especialidades (id, nome, ativa) values
  ('30000000-0000-0000-0000-000000000001', 'Estética Avançada', true),
  ('30000000-0000-0000-0000-000000000002', 'Dermatologia', true),
  ('30000000-0000-0000-0000-000000000003', 'Biomedicina Estética', true),
  ('30000000-0000-0000-0000-000000000004', 'Micropigmentação', true),
  ('30000000-0000-0000-0000-000000000005', 'Podologia', true)
on conflict (id) do nothing;

insert into public.formas_pagamento (id, codigo, nome, ativo) values
  ('40000000-0000-0000-0000-000000000001', 'DINHEIRO', 'Dinheiro', true),
  ('40000000-0000-0000-0000-000000000002', 'PIX', 'PIX', true),
  ('40000000-0000-0000-0000-000000000003', 'CARTAO_CREDITO', 'Cartão de Crédito', true),
  ('40000000-0000-0000-0000-000000000004', 'CARTAO_DEBITO', 'Débito', true),
  ('40000000-0000-0000-0000-000000000005', 'OUTROS', 'Outros', true)
on conflict (id) do nothing;

insert into public.unidades_medida (id, nome, ativo) values
  ('50000000-0000-0000-0000-000000000001', 'UN', true),
  ('50000000-0000-0000-0000-000000000002', 'ML', true),
  ('50000000-0000-0000-0000-000000000003', 'LT', true),
  ('50000000-0000-0000-0000-000000000004', 'MG', true),
  ('50000000-0000-0000-0000-000000000005', 'KG', true)
on conflict (id) do nothing;

alter table public.clinicas enable row level security;
alter table public.setores enable row level security;
alter table public.cargos enable row level security;
alter table public.especialidades enable row level security;
alter table public.formas_pagamento enable row level security;
alter table public.unidades_medida enable row level security;
alter table public.profissionais enable row level security;
alter table public.clientes enable row level security;
alter table public.anamneses enable row level security;
alter table public.fornecedores enable row level security;
alter table public.produtos enable row level security;
alter table public.tratamentos enable row level security;
alter table public.atendimentos enable row level security;
alter table public.prontuarios enable row level security;
alter table public.prontuarios_anexos enable row level security;
alter table public.estoque_movimentacoes enable row level security;
alter table public.atendimento_produtos enable row level security;
alter table public.pagamentos enable row level security;

create policy "clinicas_select" on public.clinicas
for select to authenticated
using (public.can_access_clinica(id));

create policy "masters_select" on public.setores
for select to authenticated
using (true);

create policy "masters_write" on public.setores
for all to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "cargos_select" on public.cargos
for select to authenticated
using (true);

create policy "cargos_write" on public.cargos
for all to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "especialidades_select" on public.especialidades
for select to authenticated
using (true);

create policy "especialidades_write" on public.especialidades
for all to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "formas_pagamento_select" on public.formas_pagamento
for select to authenticated
using (true);

create policy "formas_pagamento_write" on public.formas_pagamento
for all to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "unidades_medida_select" on public.unidades_medida
for select to authenticated
using (true);

create policy "unidades_medida_write" on public.unidades_medida
for all to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "profissionais_select" on public.profissionais
for select to authenticated
using (auth.uid() = auth_user_id or public.is_admin_user());

create policy "profissionais_insert" on public.profissionais
for insert to authenticated
with check (auth.uid() = auth_user_id or public.is_admin_user() or public.can_access_clinica(clinica_id));

create policy "profissionais_update" on public.profissionais
for update to authenticated
using (auth.uid() = auth_user_id or public.is_admin_user())
with check (auth.uid() = auth_user_id or public.is_admin_user() or public.can_access_clinica(clinica_id));

create policy "profissionais_delete" on public.profissionais
for delete to authenticated
using (public.is_admin_user());

create policy "clientes_crud" on public.clientes
for all to authenticated
using (public.can_access_clinica(clinica_id))
with check (public.can_access_clinica(clinica_id));

create policy "anamneses_crud" on public.anamneses
for all to authenticated
using (public.can_access_clinica(clinica_id))
with check (public.can_access_clinica(clinica_id));

create policy "fornecedores_crud" on public.fornecedores
for all to authenticated
using (public.can_access_clinica(clinica_id))
with check (public.can_access_clinica(clinica_id));

create policy "produtos_crud" on public.produtos
for all to authenticated
using (public.can_access_clinica(clinica_id))
with check (public.can_access_clinica(clinica_id));

create policy "tratamentos_crud" on public.tratamentos
for all to authenticated
using (public.can_access_clinica(clinica_id))
with check (public.can_access_clinica(clinica_id));

create policy "atendimentos_crud" on public.atendimentos
for all to authenticated
using (public.can_access_clinica(clinica_id))
with check (public.can_access_clinica(clinica_id));

create policy "prontuarios_crud" on public.prontuarios
for all to authenticated
using (public.can_access_clinica(clinica_id))
with check (public.can_access_clinica(clinica_id));

create policy "prontuarios_anexos_crud" on public.prontuarios_anexos
for all to authenticated
using (
  exists (
    select 1
    from public.prontuarios p
    where p.id = prontuario_id
      and public.can_access_clinica(p.clinica_id)
  )
)
with check (
  exists (
    select 1
    from public.prontuarios p
    where p.id = prontuario_id
      and public.can_access_clinica(p.clinica_id)
  )
);

create policy "estoque_movimentacoes_crud" on public.estoque_movimentacoes
for all to authenticated
using (public.can_access_clinica(clinica_id))
with check (public.can_access_clinica(clinica_id));

create policy "atendimento_produtos_crud" on public.atendimento_produtos
for all to authenticated
using (public.can_access_clinica(clinica_id))
with check (public.can_access_clinica(clinica_id));

create policy "pagamentos_crud" on public.pagamentos
for all to authenticated
using (public.can_access_clinica(clinica_id))
with check (public.can_access_clinica(clinica_id));

commit;
