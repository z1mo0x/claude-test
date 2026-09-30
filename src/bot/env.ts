import 'server-only'

/** Переменные окружения бота. Без токена бот выключен, сайт при этом работает как обычно. */
export function botEnv() {
  const e = (name: string) => (process.env[name] ?? '').trim()
  return {
    token: e('TELEGRAM_BOT_TOKEN'),
    webhookSecret: e('TELEGRAM_WEBHOOK_SECRET'),
    cronSecret: e('CRON_SECRET'),
    /** Единственный, кому бот отвечает: числовой Telegram id владельца. */
    ownerId: e('OWNER_TELEGRAM_ID'),
    /** Ник владельца на GitHub: по нему в базе находятся «мои» могилы для текстов постов. */
    ownerLogin: e('OWNER_GITHUB_LOGIN').replace(/^@/, ''),
    /** Канал для публикаций: @username или -100…. Без него посты «в канал» приходят напоминаниями. */
    channel: e('TELEGRAM_CHANNEL_ID'),
    /** День 0 календаря, YYYY-MM-DD по Москве. Пока не задан, cron ничего не отправляет. */
    startDate: e('PROMO_START_DATE'),
    /** 1 — в канал не публиковать, а присылать владельцу предпросмотр. */
    dryRun: e('BOT_DRY_RUN') === '1',
    site: (e('SITE_URL') || 'https://projectyard-bury.vercel.app').replace(/\/+$/, ''),
  }
}

export const botEnabled = () => Boolean(botEnv().token)
