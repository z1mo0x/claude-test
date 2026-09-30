-- История числа подписчиков канала для экрана «Метрики» в боте. Выполнять после 0006_bot_users.sql.
-- Раз в сутки (по Москве) cron записывает сюда число подписчиков: Telegram отдаёт только текущее значение,
-- а рост за неделю по нему не узнать. Таблица закрыта: RLS включён, политик нет, ходит только сайт ключом service_role.
-- Повторный запуск безопасен.

create table if not exists public.channel_stats (
  -- День по Москве.
  day date primary key,
  subscribers integer not null check (subscribers >= 0),
  created_at timestamptz not null default now()
);

alter table public.channel_stats enable row level security;
revoke all on public.channel_stats from anon, authenticated;
grant select, insert, update, delete on public.channel_stats to service_role;
