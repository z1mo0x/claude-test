import type { NextConfig } from 'next'

// Шрифты и картинки для PNG свидетельства читаются с диска в рантайме — их нужно положить в сборку явно.
const certificateFonts = [
  './node_modules/@fontsource/{cormorant-garamond,jetbrains-mono,manrope}/files/*-{latin,cyrillic}-{400,500,600,700}-{normal,italic}.woff',
  './public/images/*.png',
]

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/r/[owner]/[repo]/certificate.png': certificateFonts,
    '/opengraph-image': certificateFonts,
  },
}

export default nextConfig
