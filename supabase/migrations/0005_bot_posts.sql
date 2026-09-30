-- Что бот уже отправил из календаря постов, чтобы не повторяться при каждом запуске cron.
-- Таблица закрыта: RLS включён, политик нет. Читает и пишет только наш сервер ключом service_role.
-- Выполнять после 0004_reports.sql. Повторный запуск безопасен.

create table if not exists public.bot_posts (
  -- id поста из src/bot/schedule.ts
  post_id text primary key,
  -- sent — опубликован в канал или напоминание отправлено; failed — не вышло, cron не повторяет сам.
  status text not null check (status in ('sent', 'failed')),
  sent_at timestamptz not null default now(),
  -- Пояснение: id сообщения в канале или текст ошибки.
  note text
);

alter table public.bot_posts enable row level security;
revoke all on public.bot_posts from anon, authenticated;
grant select, insert, update, delete on public.bot_posts to service_role;
