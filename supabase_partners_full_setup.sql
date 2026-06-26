-- Eco · Clientes (design partners) — setup completo en un solo paso
-- Correr en Supabase → SQL Editor (primera vez o reset)
--
-- Incluye: tabla eco_partners + ICP/plan + invite links + constraints
-- Después: SUPABASE_SERVICE_ROLE_KEY en Vercel + ECO_ACCESS_MODE=partners

create table if not exists eco_partners (
  id                    text primary key,
  name                  text not null,
  brand_slugs           jsonb not null default '[]'::jsonb,
  competitor_slugs      jsonb not null default '[]'::jsonb,
  competitor_by_brand   jsonb not null default '{}'::jsonb,
  active                boolean not null default true,
  contact_email         text,
  notes                 text,
  icp                   text not null default 'agencia',
  plan                  text not null default 'portfolio',
  channel_ids           jsonb not null default '[]'::jsonb,
  benchmark_channel_ids jsonb not null default '[]'::jsonb,
  modules               jsonb not null default '{}'::jsonb,
  price_ars_month       integer,
  contract_started_at   date,
  password_hash         text not null default '',
  invite_token_hash     text,
  invite_expires_at     timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Columnas por si la tabla existía sin ICP/plan (upgrade parcial)
alter table eco_partners
  add column if not exists invite_token_hash text,
  add column if not exists invite_expires_at timestamptz,
  add column if not exists icp text not null default 'agencia',
  add column if not exists plan text not null default 'portfolio',
  add column if not exists channel_ids jsonb not null default '[]'::jsonb,
  add column if not exists benchmark_channel_ids jsonb not null default '[]'::jsonb,
  add column if not exists modules jsonb not null default '{}'::jsonb,
  add column if not exists price_ars_month integer,
  add column if not exists contract_started_at date;

create index if not exists eco_partners_active_idx on eco_partners (active);

create index if not exists eco_partners_invite_hash_idx
  on eco_partners (invite_token_hash)
  where invite_token_hash is not null;

alter table eco_partners enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'eco_partners_icp_check'
  ) then
    alter table eco_partners
      add constraint eco_partners_icp_check
      check (icp in ('agencia', 'marca', 'canal'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'eco_partners_plan_check'
  ) then
    alter table eco_partners
      add constraint eco_partners_plan_check
      check (plan in ('brand_starter', 'portfolio', 'portfolio_pro', 'channel'));
  end if;
end $$;

comment on column eco_partners.icp is 'agencia | marca | canal — SPEC-010';
comment on column eco_partners.plan is 'brand_starter | portfolio | portfolio_pro | channel — MARKET-002';
