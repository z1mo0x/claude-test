-- Что хранить, а что считать. Выполнять после 0001_bury.sql. Повторный запуск безопасен.
-- В базе остаётся снимок репозитория на момент похорон и то, что ввёл человек.
-- Всё, что выводится из этих полей, считается при показе.

alter table public.projects
  -- id репозитория на GitHub. Не меняется при переименовании и передаче репозитория:
  -- по нему узнаём, что проект уже похоронен, и по нему основной сайт подтянет живые данные.
  add column if not exists repo_id bigint,
  -- Для каталога на основном сайте: фильтр по тегам и лицензия, от которой зависит,
  -- можно ли передать проект новому хозяину.
  add column if not exists topics text[] not null default '{}',
  add column if not exists license text;

create unique index if not exists projects_repo_id_key on public.projects (repo_id);

-- Ссылка на репозиторий собирается из repo_owner и repo_name.
alter table public.projects drop column if exists repo_url;
-- Первый коммит нигде не показывается, а стоил лишнего запроса к GitHub на каждую проверку.
alter table public.projects drop column if exists first_words;

-- slug теперь считает сама база, код его не пишет. Старая колонка удаляется вместе с индексом.
alter table public.projects drop column if exists slug;
alter table public.projects
  add column slug text generated always as (lower(repo_owner || '/' || repo_name)) stored;
create unique index if not exists projects_slug_key on public.projects (slug);
