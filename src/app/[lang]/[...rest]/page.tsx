import { notFound } from 'next/navigation'

/** Любой неизвестный адрес внутри языка: показываем not-found.tsx этого языка. */
export default function Missing() {
  notFound()
}
