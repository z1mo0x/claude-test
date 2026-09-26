import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { CertificateAssets } from './types'

const cache = new Map<string, Promise<string>>()

/** Картинка из public/images как data URI: Satori не ходит за картинками по относительным путям. */
export function imageDataUri(name: string) {
  let uri = cache.get(name)
  if (!uri) {
    uri = readFile(join(process.cwd(), 'public/images', name)).then((data) => `data:image/png;base64,${data.toString('base64')}`)
    cache.set(name, uri)
  }
  return uri
}

export async function certificateAssets(): Promise<CertificateAssets> {
  const [logo, backdrop] = await Promise.all([imageDataUri('logo.png'), imageDataUri('graveyard.png')])
  return { logo, backdrop }
}
