-- Migración: invitaciones por link (correr si ya tenés eco_partners)
alter table eco_partners
  add column if not exists invite_token_hash text,
  add column if not exists invite_expires_at timestamptz;

create index if not exists eco_partners_invite_hash_idx
  on eco_partners (invite_token_hash)
  where invite_token_hash is not null;
