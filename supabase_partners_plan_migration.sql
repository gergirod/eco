-- Eco · ICP + plan en eco_partners (SPEC-010 §3.2)
-- Correr en Supabase → SQL Editor después de supabase_partners_schema.sql
-- y supabase_partners_invite_migration.sql

alter table eco_partners
  add column if not exists icp text not null default 'agencia',
  add column if not exists plan text not null default 'portfolio',
  add column if not exists channel_ids jsonb not null default '[]'::jsonb,
  add column if not exists benchmark_channel_ids jsonb not null default '[]'::jsonb,
  add column if not exists modules jsonb not null default '{}'::jsonb,
  add column if not exists price_ars_month integer,
  add column if not exists contract_started_at date;

-- Constraints (idempotente: omitir si ya existen)
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
