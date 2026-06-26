-- Eco · design partners (clientes con acceso scoped)
-- Correr en Supabase → SQL Editor después de supabase_schema.sql
--
-- Escritura: API backoffice con service_role key
-- Login: /api/partner/auth verifica password_hash (sin exponer a anon)

create table if not exists eco_partners (
  id                  text primary key,
  name                text not null,
  brand_slugs         jsonb not null default '[]'::jsonb,
  competitor_slugs    jsonb not null default '[]'::jsonb,
  competitor_by_brand jsonb not null default '{}'::jsonb,
  active              boolean not null default true,
  contact_email       text,
  notes               text,
  password_hash       text not null default '',
  invite_token_hash   text,
  invite_expires_at   timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists eco_partners_active_idx on eco_partners (active);
create index if not exists eco_partners_invite_hash_idx
  on eco_partners (invite_token_hash)
  where invite_token_hash is not null;

alter table eco_partners enable row level security;
-- Sin policies públicas: solo service_role (API server-side) lee/escribe.
