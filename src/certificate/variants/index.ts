import type { CertificateVariant } from '../types'
import { classic } from './classic'

/**
 * Все варианты оформления. Чтобы добавить новый, положи рядом файл с
 * `CertificateVariant` и допиши его сюда. Выбор варианта в форме появится сам,
 * как только здесь будет больше одного; выбранный id сохраняется в projects.variant.
 */
export const variants: CertificateVariant[] = [classic]

export const defaultVariant = classic

export function getVariant(id: string | null | undefined) {
  return variants.find((v) => v.id === id) ?? defaultVariant
}

export function isVariant(id: string) {
  return variants.some((v) => v.id === id)
}
