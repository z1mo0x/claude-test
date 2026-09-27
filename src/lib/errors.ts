import type { LookupError } from './github'

export type BuryError = LookupError | 'storage' | 'bad_input' | 'save_failed' | 'too_many' | 'too_famous' | 'bot'

export const errorMessages: Record<BuryError, string> = {
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
}
