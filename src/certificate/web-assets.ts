import { getImageProps } from 'next/image'
import type { CertificateAssets } from './types'

function optimized(src: string, width: number, height: number) {
  return getImageProps({ src, width, height, alt: '' }).props.src
}

/** Те же картинки, что в PNG, но через оптимизатор next/image. */
export const webAssets: CertificateAssets = {
  logo: optimized('/images/logo.png', 32, 38),
  backdrop: optimized('/images/graveyard.png', 600, 338),
}
