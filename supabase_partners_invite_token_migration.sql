-- Guardar token plano para mostrar link copiable en backoffice (solo service role)
-- Correr en Supabase → SQL Editor si la tabla ya existía sin esta columna

alter table eco_partners
  add column if not exists invite_token text;

comment on column eco_partners.invite_token is 'Token plano del link /acceso/entrar — solo backoffice; no exponer al cliente vía API pública';
