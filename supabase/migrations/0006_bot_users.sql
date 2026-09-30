-- Бот для обычных людей: привязка Telegram к нику на GitHub и ответы на обращения. Выполнять после 0005_bot_posts.sql.
-- Обе таблицы закрыты: RLS включён, политик нет, публичный ключ их не видит. Ходит только сайт ключом service_role.
-- Повторный запуск безопасен.

-- Кто из людей привязал себе ник GitHub. Ник не проверяется: по нему показываются только публичные данные
-- (могилы) и обращения, которые человек подал сам.
create table if not exists public.bot_users (
  tg_chat_id bigint primary key,
  github_login text not null check (char_length(github_login) between 1 and 39),
  created_at timestamptz not null default now()
);

alter table public.bot_users enable row level security;
revoke all on public.bot_users from anon, authenticated;
grant select, insert, update, delete on public.bot_users to service_role;

-- Кому отвечать по обращению: чат в Telegram, который нажал Start по ссылке с reply_token
-- (со страницы сайта) или подал обращение прямо в боте.
alter table public.reports add column if not exists tg_chat_id bigint;
alter table public.reports add column if not exists reply_token text;

create unique index if not exists reports_reply_token_idx on public.reports (reply_token) where reply_token is not null;
create index if not exists reports_tg_chat_idx on public.reports (tg_chat_id, created_at desc) where tg_chat_id is not null;
