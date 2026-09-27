import { isLogin } from './repo-link'

/** Ник на GitHub того, кто хоронит в этом браузере. Подставляется в форму и в ссылку. */
const KEY = 'projectyard:profile'

export function savedLogin(): string | null {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    return typeof value?.login === 'string' && isLogin(value.login) ? value.login : null
  } catch {
    return null
  }
}

export function rememberLogin(login: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ login }))
  } catch {
    // Приватный режим или запрет хранилища: в следующий раз ник придётся ввести заново.
  }
}
