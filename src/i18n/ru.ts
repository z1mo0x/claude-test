import type { CauseId } from '@/lib/causes'
import type { BuryError, ReportError } from '@/lib/errors'
import { commitsLabel, formatDate, lifetime, plural } from '@/lib/format'
import type { Network } from '@/lib/share'

/**
 * Все тексты сайта на русском. Английский словарь (en.ts) повторяет эту форму,
 * TypeScript не даст пропустить ключ. Русский — основной язык, адреса без префикса.
 */
export const ru = {
  ogLocale: 'ru_RU',
  format: {
    date: formatDate,
    lifetime,
    commits: commitsLabel,
  },

  meta: {
    title: 'Projectyard — похорони заброшенный репозиторий',
    description:
      'Кладбище незаконченных пет-проектов. Вставь ссылку на заброшенный репозиторий GitHub, проведи похороны и получи свидетельство о смерти, которым можно поделиться.',
    keywords: ['заброшенный репозиторий', 'пет-проект', 'GitHub', 'свидетельство о смерти', 'кладбище проектов', 'Projectyard'],
    imageAlt: 'Projectyard — проводи репозиторий в последний путь',
    schema: (count: number, goal: number) =>
      `Кладбище заброшенных пет-проектов: похорони репозиторий GitHub и получи свидетельство о его смерти. Похоронено ${count} из ${goal}.`,
    graveMissing: 'Могила не найдена',
    graveTitle: (name: string) => `${name} — свидетельство о смерти`,
    graveDescription: (epitaph: string, cause: string) => `«${epitaph}» Причина смерти: ${cause.toLowerCase()}.`,
    graveImageAlt: (repo: string) => `Свидетельство о смерти ${repo}`,
  },

  /** Картинка превью главной (og.png). */
  og: {
    title: ['Проводи', 'репозиторий'],
    accent: 'в последний путь',
    tagline: 'Свидетельство о смерти для заброшенного проекта',
  },

  header: {
    switchLabel: 'Русская версия',
  },

  goal: {
    unit: 'проектов',
    title: 'Что будет на сотом проекте',
    titleReached: 'Сто проектов похоронено',
    now: 'Пока здесь можно только похоронить репозиторий и получить свидетельство о его смерти.',
    plan: (goal: number) =>
      `Когда здесь наберётся ${goal} проектов, начнём разработку основного Projectyard — кладбища, где у каждого проекта будет своя могила. Все, кого похоронили здесь, переедут туда первыми.`,
    planReached:
      'Начинаем разработку основного Projectyard — кладбища, где у каждого проекта будет своя могила. Все, кого похоронили здесь, переедут туда первыми.',
    of: 'из',
    left: (n: number) => `${plural(n, ['остался', 'осталось', 'осталось'])} ${n}`,
    close: 'Понятно',
  },

  home: {
    title: ['Проводи репозиторий', 'в последний путь'],
    lead: 'Вставь ссылку на GitHub. Даты, возраст и последние слова подтянутся сами, останется выбрать причину смерти и написать эпитафию.',
  },

  form: {
    link: 'Ссылка на репозиторий',
    linkPlaceholder: 'https://github.com/ник/проект',
    clearLink: 'Стереть ссылку',
    waiting: 'жду ссылку на GitHub',
    searching: 'ищу репозиторий…',
    found: 'найден',
    alreadyBuried: 'уже похоронен.',
    openCertificate: 'Открыть свидетельство',
    cause: 'Причина смерти',
    epitaph: 'Эпитафия',
    shuffle: 'Другая эпитафия',
    mourner: 'Кто хоронит',
    mournerNote: 'ник на GitHub',
    mournerPlaceholder: 'ник',
    mournerInvalid: 'ник на GitHub: латиница, цифры и дефис',
    mournerHint: 'будет на свидетельстве и запомнится',
    style: 'Оформление',
    adoptable: 'Можно передать проект новому хозяину, когда откроется основной Projectyard',
    checking: 'проверяем, что ты не бот…',
    submit: 'Похоронить',
    preview: 'предпросмотр. Эта картинка прикрепится к ссылке',
    previewOwner: 'владелец',
    previewName: 'репозиторий',
  },

  causes: {
    burnout: 'Выгорание',
    study: 'Учёба',
    job: 'Основная работа',
    interest: 'Пропал интерес',
    scope: 'Разросся скоуп',
    money: 'Нет денег',
    debt: 'Техдолг',
    better: 'Нашлась идея получше',
    time: 'Нет времени',
    experiment: 'Это был эксперимент',
    other: 'Другое',
  } satisfies Record<CauseId, string>,

  epitaphs: [
    'Работал на моей машине.',
    'Ушёл на рефакторинг и не вернулся.',
    'Здесь покоится TODO. Его так и не сделали.',
    'Доделаю на выходных. Не доделал.',
    'Лендинг был готов. Продукт — нет.',
    'Последний деплой прошёл успешно.',
  ],

  errors: {
    invalid: 'Это не похоже на ссылку на репозиторий GitHub',
    not_found: 'Репозиторий не найден. Он точно публичный?',
    rate_limited: 'GitHub просит подождать. Попробуй через минуту',
    unavailable: 'GitHub не отвечает. Попробуй ещё раз',
    storage: 'Кладбище временно закрыто. Попробуй чуть позже',
    bad_input: 'Выбери причину смерти, напиши эпитафию и укажи ник на GitHub',
    save_failed: 'Не получилось сохранить. Попробуй ещё раз',
    too_many: 'Слишком много запросов подряд. Кладбищу нужна минута тишины, попробуй позже',
    too_famous: 'У проекта больше 1000 звёзд, он не похож на заброшенный. Здесь хоронят свои недоделанные проекты',
    bot: 'Не получилось проверить, что ты не бот. Обнови страницу и попробуй ещё раз',
  } satisfies Record<BuryError, string>,

  scene: {
    label: (repo: string) => `Похороны ${repo}`,
    farewell: (name: string) => `Прощание с ${name}`,
    development: (lived: string) => `${lived} разработки`,
    noLanguage: 'без языка',
    slow: 'оформляем свидетельство…',
    back: 'Вернуться к форме',
    cancel: 'Отменить похороны',
    leaving: 'оформляю свидетельство…',
  },

  grave: {
    status: (plot: string) => `status: BURIED · участок № ${plot}`,
    caption: (repo: string, cause: string, epitaph: string) =>
      `Свидетельство о смерти репозитория ${repo}. Причина: ${cause}. Эпитафия: ${epitaph}`,
    buryAnother: 'Похоронить ещё один',
    buryYours: 'Похоронить свой репозиторий',
  },

  /** Форма «удалить или пожаловаться» на странице свидетельства. */
  report: {
    open: 'Удалить или пожаловаться',
    title: 'Удалить или пожаловаться',
    close: 'Закрыть',
    kind: 'Что случилось',
    removeOwn: 'Это мой проект, уберите могилу',
    complaint: 'Пожаловаться на эту могилу',
    reason: 'Расскажи подробнее',
    reasonPlaceholder: 'Например: я владелец репозитория и хочу убрать свидетельство',
    contact: 'Как с тобой связаться (необязательно)',
    contactPlaceholder: 'Telegram, почта или ник на GitHub',
    note: 'Обращения читает человек, могилы сами не удаляются. Чтобы убрать могилу, нужно подтвердить, что репозиторий твой.',
    submit: 'Отправить',
    sending: 'Отправляю…',
    done: 'Готово. Обращение получено, я разберу его вручную.',
    errors: {
      bad_input: 'Выбери, что случилось, и опиши это в нескольких словах',
      not_found: 'Такой могилы нет. Обнови страницу',
      too_many: 'Обращений слишком много. Попробуй позже',
      bot: 'Не получилось проверить, что ты не бот. Обнови страницу и попробуй ещё раз',
      storage: 'Не получилось отправить. Попробуй чуть позже',
    } satisfies Record<ReportError, string>,
  },

  /** Бейдж для README репозитория: блок на странице свидетельства и подпись на самой плашке. */
  badge: {
    title: 'Бейдж для README',
    hint: 'вставь в README репозитория: бейдж ведёт на свидетельство',
    copy: 'Копировать Markdown',
    copied: 'Скопировано',
    alt: 'Похоронен на Projectyard',
    label: 'projectyard',
    text: (lived: string | null) => (lived ? `прожил ${lived}` : 'похоронен'),
  },

  share: {
    button: 'Поделиться',
    title: 'Поделиться',
    close: 'Закрыть',
    copied: 'Скопировано',
    link: 'Ссылка',
    downloadPng: 'Скачать PNG',
    downloadStoryLabel: 'Скачать свидетельство для сторис',
    imageAlt: 'Картинка, которая прикрепится к ссылке',
    postLabel: 'Текст поста',
    postHint: 'ссылка добавится сама, к ней прикрепится свидетельство',
    copyLink: 'Копировать ссылку',
    copyText: 'Копировать текст',
    copyImage: 'Копировать картинку',
    imageCopied: 'Картинка в буфере',
    downloadCard: 'Скачать PNG 1200×630',
    downloadStory: 'Скачать для сторис',
    imageFailed: 'браузер не дал скопировать картинку, скачай PNG',
    imageHint: 'картинку из буфера можно вставить в Discord, Telegram или X',
    networks: ['telegram', 'x', 'vk', 'reddit', 'linkedin', 'threads'] as Network[],
    post: (name: string, lived: string | null) => {
      const intro = lived ? `${lived} разработки. ` : ''
      return `${intro.charAt(0).toUpperCase()}${intro.slice(1)}Сегодня ${name} официально похоронен.\nRIP ${name} ⚰️`
    },
  },

  /** Подписи на самом свидетельстве: на странице и в PNG. */
  certificate: {
    title: 'Свидетельство о смерти',
    /** На сторис заголовок в две строки. */
    titleLines: ['Свидетельство', 'о смерти'],
    issued: (plot: string, date: string) => `№ ${plot} · выдано ${date}`,
    seal: 'ПОХОРОНЕН',
    born: 'Родился',
    died: 'Умер',
    lived: 'Прожил',
    commits: 'Коммитов',
    lastWords: 'Последние слова',
    cause: 'Причина смерти',
    silence: (lived: string) => `тишина ${lived}`,
    noCommits: 'коммитов не было',
    quote: (text: string) => `«${text}»`,
    cta: 'Похорони свой репозиторий',
  },

  notFound: {
    status: '404: могила не найдена',
    title: 'Здесь никого не хоронили',
    text: 'Может, репозиторий ещё жив. А может, его как раз пора проводить.',
    action: 'Похоронить репозиторий',
  },

  error: {
    status: '500: кладбище закрыто',
    title: 'Что-то сломалось',
    text: 'Похоже, база не отвечает. Попробуй обновить страницу через минуту.',
    action: 'Попробовать ещё раз',
  },
}

export type Dictionary = typeof ru
