// All page copy lives here so it can be edited without touching the components.

export const profile = {
  nick: 'z1mo0x',
  name: 'Морозов',
  role: 'Фронтенд-разработчик',
  telegram: '@effective_z1mo0x',
  telegramUrl: 'https://t.me/effective_z1mo0x',
  githubUrl: 'https://github.com/z1mo0x',
  availability: 'Открыт к новым проектам',
}

export const media = {
  heroVideo:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4',
  // Montage of real project screenshots, rendered from the projects themselves.
  showreel: '/media/showreel.webm',
  showreelPoster: '/media/showreel-poster.webp',
}

export const nav = [
  { label: 'Главная', href: '#top' },
  { label: 'Проекты', href: '#projects' },
  { label: 'Обо мне', href: '#about' },
  { label: 'Услуги', href: '#services' },
  { label: 'Контакты', href: '#contact' },
]

export const stats = [
  { value: 6, suffix: '', label: 'лет в вёрстке и фронтенде' },
  { value: 4, suffix: '', label: 'года коммерческой разработки' },
  { value: 25, suffix: '+', label: 'репозиториев на GitHub' },
]

export type Project = {
  id: string
  no: string
  year: string
  kind: string
  title: string
  tagline: string
  description: string
  features: string[]
  stack: string[]
  repo: string
  /** Screenshots in public/projects; the first one is the cover. Each has a `-sm` variant for small sizes. */
  shots: Shot[]
}

export type Shot = { src: string; alt: string; device: 'desktop' | 'mobile' }

const shot = (name: string, alt: string, device: Shot['device'] = 'desktop'): Shot => ({
  src: `/projects/${name}`,
  alt,
  device,
})

/** Resolves a shot's base path to its full-size or small WebP. */
export const shotUrl = (s: Shot | string, size: 'lg' | 'sm' = 'lg') =>
  `${typeof s === 'string' ? s : s.src}${size === 'sm' ? '-sm' : ''}.webp`

export const projects: Project[] = [
  {
    id: 'integra',
    no: '01',
    year: '2025',
    kind: 'Веб-приложение',
    title: 'Integra',
    tagline: 'CRM-панель для бизнеса',
    description:
      'Панель управления компанией: дашборд с выручкой и клиентами, каталог товаров в таблицах, регистрация с выбором компании и закрытые разделы после входа.',
    features: [
      'Дашборд с ключевыми метриками и динамикой к прошлому месяцу',
      'Таблицы товаров на TanStack Table',
      'Авторизация через NextAuth с Prisma-адаптером',
    ],
    stack: ['Next.js', 'TypeScript', 'Prisma', 'NextAuth', 'Supabase', 'TanStack', 'shadcn/ui'],
    repo: 'https://github.com/Integra-bussiness/Integra',
    shots: [shot('integra-1', 'Integra: схема базы данных в разделе «Структура»'), shot('integra-2', 'Integra: форма входа')],
  },
  {
    id: 'project-yard',
    no: '02',
    year: '2026',
    kind: 'Веб-сервис',
    title: 'Project Yard',
    tagline: 'Кладбище незаконченных проектов',
    description:
      'Сервис с юмором для всех, у кого копятся заброшенные пет-проекты: входишь через GitHub, выбираешь репозиторий и «хоронишь» его на цифровом кладбище.',
    features: [
      'Вход через GitHub и импорт репозиториев',
      'Лента «Недавние похороны», случайная могила и «Зал славы»',
      'Мультиязычный роутинг',
    ],
    stack: ['Next.js', 'TypeScript', 'Supabase', 'React Query', 'Framer Motion', 'shadcn/ui'],
    repo: 'https://github.com/z1mo0x/gravejects',
    shots: [shot('project-yard-1', 'Project Yard: главная страница кладбища проектов'), shot('project-yard-m', 'Project Yard на телефоне', 'mobile')],
  },
  {
    id: 'seller-labs',
    no: '03',
    year: '2025',
    kind: 'Лендинг сервиса',
    title: 'Seller Labs',
    tagline: 'Инструменты для продавцов маркетплейсов',
    description:
      'Сервис для селлеров: идеи для новых товаров, анализ отзывов и генерация описаний карточек. Анимированный первый экран и формы с валидацией.',
    features: [
      'Анимация заголовка на Framer Motion',
      'Формы на React Hook Form + Zod',
      'Светлая и тёмная темы',
    ],
    stack: ['Next.js', 'TypeScript', 'React Hook Form', 'Zod', 'Framer Motion', 'Tailwind'],
    repo: 'https://github.com/z1mo0x/Seller-Labs',
    shots: [shot('seller-labs-1', 'Seller Labs: первый экран с инструментами для селлеров')],
  },
  {
    id: 'wishlist',
    no: '04',
    year: '2026',
    kind: 'Веб-приложение',
    title: 'Wishlist',
    tagline: 'Вишлист ко дню рождения',
    description:
      'Список подарков, где гости бронируют подарок, чтобы никто не подарил одно и то же. Бронь можно снять, а таймер показывает, сколько дней осталось до праздника.',
    features: [
      'Бронирование подарков через Supabase',
      'Счётчик дней до праздника',
      'Уведомления о действиях через Sonner',
    ],
    stack: ['React', 'Vite', 'TypeScript', 'Supabase', 'shadcn/ui', 'Framer Motion'],
    repo: 'https://github.com/z1mo0x/wishlist',
    shots: [shot('wishlist-1', 'Wishlist: шапка со счётчиком дней до праздника'), shot('wishlist-m', 'Wishlist на телефоне', 'mobile')],
  },
  {
    id: 'linnark-nails',
    no: '05',
    year: '2026',
    kind: 'Сайт для бизнеса',
    title: 'Linnark Nails',
    tagline: 'Сайт мастера маникюра',
    description:
      'Сайт-визитка для мастера маникюра: услуги и дополнительные услуги, карусели, контакты, схема «Как добраться» и запись.',
    features: ['Плавный скролл на Lenis', 'Карусели на Swiper и Embla', 'Анимации появления блоков'],
    stack: ['Next.js', 'TypeScript', 'Lenis', 'Swiper', 'Framer Motion', 'Tailwind'],
    repo: 'https://github.com/z1mo0x/linnark-nails',
    shots: [
      shot('linnark-nails-1', 'Linnark Nails: первый экран с работами мастера'),
      shot('linnark-nails-2', 'Linnark Nails: карусель работ и цены'),
      shot('linnark-nails-3', 'Linnark Nails: контакты и схема проезда'),
    ],
  },
  {
    id: 'intro',
    no: '06',
    year: '2025',
    kind: '3D и интерактив',
    title: 'Intro 3D',
    tagline: 'Промо-страница с 3D-клавиатурой',
    description:
      'Экспериментальная промо-страница: 3D-клавиатура на Three.js сначала занимает весь экран, а при скролле сжимается и уступает место тексту.',
    features: ['Сцена на React Three Fiber и Drei', 'Анимации, привязанные к скроллу', 'Плавный скролл на Lenis'],
    stack: ['Next.js', 'React Three Fiber', 'Three.js', 'Lenis', 'Framer Motion'],
    repo: 'https://github.com/z1mo0x/intro',
    shots: [
      shot('intro-1', 'Intro 3D: первый экран с 3D-клавиатурой'),
      shot('intro-2', 'Intro 3D: клавиатура после скролла'),
      shot('intro-m', 'Intro 3D на телефоне', 'mobile'),
    ],
  },
]

export const moreProjects = [
  {
    title: 'Поздравление',
    year: '2026',
    text: 'Интерактивная открытка к рождению ребёнка',
    stack: 'Next.js',
    repo: 'https://github.com/z1mo0x/pozdravlenie',
    image: '/projects/pozdravlenie-1',
  },
  {
    title: 'Дайджест недели',
    year: '2025',
    text: 'Новостной дайджест компании Бревис с комментариями',
    stack: 'React · Supabase',
    repo: 'https://github.com/z1mo0x/brevis-dyedjest',
    image: '/projects/brevis-1',
  },
  {
    title: 'Windows-портфолио',
    year: '2025',
    text: 'Портфолио в виде рабочего стола: окна, блокнот, календарь',
    stack: 'React · TypeScript',
    repo: 'https://github.com/z1mo0x/portfolio',
    image: '/projects/windows-1',
  },
  {
    title: 'Чихалка',
    year: '2026',
    text: 'Значение чиха по времени и дню недели',
    stack: 'HTML · CSS · JS',
    repo: 'https://github.com/z1mo0x/chihalka',
    image: '/projects/chihalka-1',
  },
  {
    title: 'Ранняя вёрстка',
    year: '2023',
    text: 'YANKI, Womazing, Marico, Qubly — адаптивные многостраничные макеты',
    stack: 'HTML · SCSS · Tailwind',
    repo: 'https://github.com/z1mo0x?tab=repositories',
    image: '/projects/yanki-1',
  },
]

export const about = {
  lead: 'Понимаю задачу, а потом пишу код. Не делаю «красиво ради красиво».',
  paragraphs: [
    'Начал с двухнедельного курса HTML и CSS в колледже и увлёкся настолько, что не остановился. Прошёл путь от самоучки до разработчика в digital-агентстве, где поработал с десятками сайтов.',
    'Сейчас специализируюсь на React и Next.js: делаю быстрые, удобные интерфейсы с аккуратной анимацией, от лендингов до личных кабинетов с базой данных.',
  ],
  timeline: [
    {
      year: '2025',
      title: 'Фриланс',
      text: 'Собственные проекты и клиенты: сайты для бизнеса, веб-сервисы и интерактивные страницы.',
    },
    {
      year: '2024',
      title: 'React',
      text: 'Перешёл с вёрстки на React: компонентный подход, TypeScript, первые шаги в бэкенде.',
    },
    {
      year: '2022',
      title: 'Brevis Inc.',
      text: 'Digital-агентство: десятки сайтов, реальные сроки и заказчики. Здесь навыки выросли сильнее всего.',
    },
    {
      year: '2020',
      title: 'Самообучение',
      text: 'Две недели HTML и CSS в колледже, а дальше — сам: вёрстка, JavaScript, адаптив.',
    },
  ],
  principles: [
    { title: 'Сначала задача', text: 'Разбираюсь в цели бизнеса, а потом выбираю решение.' },
    { title: 'Чистый код', text: 'Компоненты, TypeScript и понятная архитектура, чтобы через полгода всё было ясно.' },
    { title: 'Честные сроки', text: 'Оцениваю реально, держу в курсе и не пропадаю.' },
    { title: 'Скорость', text: 'Core Web Vitals, адаптив и доступность. Сайт должен летать везде.' },
  ],
}

export const services = [
  {
    title: 'Одностраничный сайт',
    text: 'Одна страница с фокусом на оффере. Подходит для рекламы и запуска продукта.',
    points: ['Адаптивный дизайн', 'Формы заявок и аналитика', 'Анимации на Framer Motion'],
    price: 44999,
  },
  {
    title: 'Многостраничный сайт',
    text: 'Структурированный сайт для бизнеса с SEO и удобной навигацией.',
    points: ['5–15 страниц', 'SEO для каждой страницы', 'Блог, каталог, админ-панель'],
    price: 59999,
  },
  {
    title: 'Интернет-магазин',
    text: 'Каталог, корзина и оплата онлайн, подключение CRM и аналитики.',
    points: ['Фильтры и поиск', 'Личный кабинет', 'Админка для товаров и заказов'],
    price: 79999,
  },
  {
    title: 'Уникальный проект',
    text: 'Индивидуальный дизайн и архитектура под нестандартные задачи.',
    points: ['Figma → React', '3D и интерактив', 'Авторизация, роли, база данных'],
    price: 99999,
  },
]
