-- =====================================================================
--  Sistema de chamados por QR Code / NFC
--  Cole este arquivo inteiro no Supabase: SQL Editor > New query > Run.
--  Pode ser executado mais de uma vez sem problemas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------
create table if not exists public.mesas (
  id         uuid primary key default gen_random_uuid(),
  numero     int unique not null check (numero between 1 and 9999),
  ativa      boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.chamados (
  id          uuid primary key default gen_random_uuid(),
  mesa_numero int not null,
  tipo        varchar(20) not null check (tipo in ('garcom', 'conta')),
  status      varchar(20) not null default 'pendente'
              check (status in ('pendente', 'em_atendimento', 'atendido')),
  created_at  timestamp with time zone not null default now(),
  atendido_em timestamp with time zone
);

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------
-- Painel: lista os chamados que ainda não foram atendidos
create index if not exists chamados_status_idx
  on public.chamados (status, created_at desc);

-- Anti-spam: busca o último chamado de uma mesa por tipo
create index if not exists chamados_mesa_tipo_idx
  on public.chamados (mesa_numero, tipo, created_at desc);

-- Garante no máximo UM chamado em aberto por mesa e por tipo.
-- Se o cliente apertar "Chamar garçom" de novo enquanto o primeiro
-- ainda não foi atendido, o sistema reaproveita o chamado existente
-- em vez de criar um card duplicado no painel.
create unique index if not exists chamados_um_aberto_por_tipo
  on public.chamados (mesa_numero, tipo)
  where status <> 'atendido';

-- ---------------------------------------------------------------------
-- Segurança (Row Level Security)
--
-- Todas as gravações passam pelo servidor do Next.js, que usa a chave
-- secreta (service_role) e valida cada pedido. O navegador só recebe a
-- chave pública, que serve apenas para OUVIR mudanças em tempo real.
-- ---------------------------------------------------------------------
alter table public.mesas    enable row level security;
alter table public.chamados enable row level security;

grant all on public.mesas, public.chamados to service_role;

-- A chave pública não grava nada, em nenhuma tabela.
revoke insert, update, delete, truncate on public.mesas, public.chamados from anon, authenticated;
revoke select on public.mesas from anon, authenticated;

-- A chave pública pode LER chamados das últimas 12 horas. É isso que permite
-- ao painel e ao celular do cliente receberem atualizações em tempo real.
-- Esses registros têm apenas número da mesa, tipo, status e horário.
grant select on public.chamados to anon, authenticated;

drop policy if exists "leitura publica de chamados recentes" on public.chamados;
create policy "leitura publica de chamados recentes"
  on public.chamados
  for select
  to anon, authenticated
  using (created_at > now() - interval '12 hours');

-- ---------------------------------------------------------------------
-- Tempo real (Supabase Realtime)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'chamados'
     ) then
    alter publication supabase_realtime add table public.chamados;
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- Opcional: mesas de 1 a 10 para começar (descomente para usar)
-- ---------------------------------------------------------------------
-- insert into public.mesas (numero)
-- select generate_series(1, 10)
-- on conflict (numero) do nothing;
