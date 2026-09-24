# z1mo0x — портфолио

Портфолио фронтенд-разработчика: кинематографичный первый экран с видео, проекты в виде билетов, которые нужно оторвать, и переходы-шторки между страницами.

**Стек:** React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui, Motion, React Router, компоненты [React Bits](https://reactbits.dev).

## Запуск

```bash
npm install
npm run dev      # локальная разработка
npm run build    # сборка в dist/
npm run preview  # просмотр собранной версии
npm run lint     # oxlint
```

## Где что менять

| Что | Где |
| --- | --- |
| Тексты, проекты, услуги, контакты, ссылки на видео | `src/data/site.ts` |
| Цвета, шрифты, `liquid-glass`, анимации | `src/index.css` |
| Секции главной | `src/components/sections/` |
| Страница проекта, 404 | `src/pages/` |
| Переход-шторка между страницами | `src/components/transition/page-transition.tsx` |
| Компоненты React Bits (ScrollExpand, TearTicket, LogoLoop, Magnet, CountUp, SpotlightCard) | `src/components/reactbits/` |

Чтобы добавить проект, допишите объект в массив `projects` в `src/data/site.ts`: появятся и билет на главной, и страница `/projects/<id>`.

## Шрифты

Заголовки набраны Instrument Serif. В нём нет кириллицы, поэтому русские буквы берутся из Noto Serif Display в узком начертании (`font-stretch: 70%`), чтобы по пропорциям совпадать с Instrument Serif. Обе гарнитуры подключены из Google Fonts в `index.html`.

## Деплой

Это SPA с клиентским роутингом. Для Vercel в `vercel.json` уже есть rewrite на `index.html`, поэтому прямые ссылки вида `/projects/integra` открываются корректно. На другом хостинге нужно настроить такой же fallback.

## Лицензии

Компоненты в `src/components/reactbits/` взяты из [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits) (MIT + Commons Clause, см. `src/components/reactbits/LICENSE.md`) и немного доработаны под проект.
