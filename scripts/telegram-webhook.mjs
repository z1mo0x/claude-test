// Регистрирует адрес бота у Telegram. Запуск: npm run bot:webhook -- https://адрес-сайта
// Токен и секрет читаются из .env.local (TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET), в чат их не пишем.
const site = (process.argv[2] ?? process.env.SITE_URL ?? '').replace(/\/+$/, '')
const token = process.env.TELEGRAM_BOT_TOKEN
const secret = process.env.TELEGRAM_WEBHOOK_SECRET

if (!site.startsWith('https://') || !token || !secret) {
  console.error('Нужны адрес сайта с https:// (аргументом) и TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET в .env.local')
  process.exit(1)
}

const call = async (method, body) => {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return response.json()
}

const set = await call('setWebhook', {
  url: `${site}/api/telegram`,
  secret_token: secret,
  allowed_updates: ['message', 'callback_query'],
  drop_pending_updates: true,
})
console.log('setWebhook:', set.ok ? 'готово' : set.description)

// Меню команд (кнопка «/» у поля ввода) для всех чатов по умолчанию.
const commands = await call('setMyCommands', {
  commands: [
    { command: 'complaints', description: 'Жалобы и обращения с сайта' },
    { command: 'next', description: 'Ближайшие посты' },
    { command: 'stats', description: 'Статистика и состояние бота' },
    { command: 'post', description: 'Предпросмотр поста: /post id' },
    { command: 'testchannel', description: 'Проверить публикацию в канал' },
    { command: 'help', description: 'Помощь' },
  ],
})
console.log('setMyCommands:', commands.ok ? 'готово' : commands.description)

// Как бот выглядит в Telegram: описание в пустом чате (до 512 символов) и «О боте» в профиле (до 120).
const description = await call('setMyDescription', {
  description: [
    '🪦 Projectyard — кладбище заброшенных пет-проектов',
    '',
    'Личный помощник владельца сайта:',
    '📋 собирает жалобы и запросы на удаление',
    '🗓 напоминает о постах по календарю продвижения',
    '📣 публикует готовые посты в канал',
    '',
    'Нажми «Запустить», чтобы открыть меню.',
  ].join('\n'),
})
console.log('setMyDescription:', description.ok ? 'готово' : description.description)

const about = await call('setMyShortDescription', {
  short_description: '🪦 Жалобы с кладбища, календарь постов и публикации в канал. Личный бот владельца.',
})
console.log('setMyShortDescription:', about.ok ? 'готово' : about.description)

const info = await call('getWebhookInfo', {})
console.log('Адрес:', info.result?.url, '| ошибка:', info.result?.last_error_message ?? 'нет')
process.exit(set.ok ? 0 : 1)
