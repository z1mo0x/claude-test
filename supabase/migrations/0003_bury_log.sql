-- Лимит похорон с одного IP. Сам IP не храним, только HMAC-хеш (см. src/lib/client-ip.ts).
-- Таблица закрыта: RLS включён, политик нет, поэтому публичный ключ основного сайта её не видит.
-- Читает и пишет только наш сервер ключом service_role. Повторный запуск безопасен.

create table if not exists public.bury_log (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists bury_log_ip_hash_created_idx on public.bury_log (ip_hash, created_at);

alter table public.bury_log enable row level security;
revoke all on public.bury_log from anon, authenticated;
grant select, insert on public.bury_log to service_role;
