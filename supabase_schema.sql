-- Streamproof · esquema mínimo para alimentar la UI desde Supabase.
-- Una sola tabla con los datasets como JSONB (cabe holgado en el free tier).
-- Correr en: Supabase → SQL Editor → New query → Run.

create table if not exists ui_data (
  key        text primary key,           -- 'channels' | 'brands' | 'products' | 'benchmark' | 'reports' | 'meta'
  payload    jsonb not null,
  updated_at timestamptz not null default now()
);

-- Lectura pública (la UI usa la anon key). La escritura la hace el uploader
-- con la service_role key, que ignora RLS.
alter table ui_data enable row level security;

drop policy if exists "public read ui_data" on ui_data;
create policy "public read ui_data"
  on ui_data for select
  using (true);
