-- Поля для похороненных репозиториев в таблице projects основного Projectyard.
-- До этой миграции в таблице были только id и created_at.

alter table public.projects
  add column if not exists slug text,
  add column if not exists repo_owner text,
  add column if not exists repo_name text,
  add column if not exists repo_url text,
  add column if not exists description text,
  add column if not exists language text,
  add column if not exists stars integer not null default 0,
  add column if not exists born_at timestamptz,
  add column if not exists died_at timestamptz,
  add column if not exists commits integer not null default 0,
  add column if not exists first_words text,
  add column if not exists last_words text,
  add column if not exists cause text,
  add column if not exists epitaph text,
  add column if not exists buried_by text,
  -- Галочка «можно передать новому хозяину». Пока только сохраняется.
  add column if not exists adoptable boolean not null default false,
  -- Вариант оформления свидетельства, см. src/certificate/variants.
  add column if not exists variant text not null default 'classic',
  -- Откуда пришла строка: 'bury' — с этой страницы.
  add column if not exists source text not null default 'bury';

-- slug = lower('owner/name'): один репозиторий хоронят один раз.
create unique index if not exists projects_slug_key on public.projects (slug);
create index if not exists projects_source_idx on public.projects (source);

-- Запись идёт только с сервера ключом service_role, он обходит RLS.
-- Читать свидетельства может кто угодно.
alter table public.projects enable row level security;
drop policy if exists "projects are readable by everyone" on public.projects;
create policy "projects are readable by everyone" on public.projects for select using (true);
