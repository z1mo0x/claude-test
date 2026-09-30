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

const info = await call('getWebhookInfo', {})
console.log('Адрес:', info.result?.url, '| ошибка:', info.result?.last_error_message ?? 'нет')
process.exit(set.ok ? 0 : 1)
