-- Обращения «удалить свою могилу» и «пожаловаться на чужую». Выполнять после 0003_bury_log.sql.
-- Сам IP не храним, только HMAC-хеш (см. src/lib/client-ip.ts): он нужен для лимита обращений.
-- Таблица закрыта: RLS включён, политик нет, публичный ключ её не видит. Пишет форма на сайте,
-- читает и меняет status простой бот владельца, оба ключом service_role. Повторный запуск безопасен.

create table if not exists public.reports (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  -- lower('owner/name') могилы, на которую пришло обращение. Внешнего ключа нет: могилу могут удалить.
  slug text not null,
  -- remove_own — «это мой проект, удалите»; complaint — жалоба на чужую могилу.
  kind text not null check (kind in ('remove_own', 'complaint')),
  reason text not null check (char_length(reason) <= 500),
  -- Как связаться: Telegram, почта или ник на GitHub. Необязательно.
  contact text check (contact is null or char_length(contact) <= 100),
  ip_hash text not null,
  status text not null default 'new' check (status in ('new', 'done', 'rejected')),
  handled_at timestamptz
);

create index if not exists reports_ip_hash_created_idx on public.reports (ip_hash, created_at);
create index if not exists reports_status_created_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;
grant select, insert, update on public.reports to service_role;
