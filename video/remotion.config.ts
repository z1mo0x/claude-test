import path from 'node:path'
import { Config } from '@remotion/cli/config'

// Картинки берём из public/ сайта, свидетельство и форматирование — из его src/.
Config.setPublicDir(path.join(process.cwd(), '..', 'public'))
Config.setVideoImageFormat('jpeg')
Config.setJpegQuality(95)
Config.setCodec('h264')
Config.setCrf(16)
Config.setPixelFormat('yuv420p')

Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...(config.resolve?.alias ?? {}),
      '@': path.join(process.cwd(), '..', 'src'),
      // Один React на всё: код сайта лежит выше и иначе подхватит свой.
      react: path.join(process.cwd(), 'node_modules/react'),
      'react-dom': path.join(process.cwd(), 'node_modules/react-dom'),
    },
  },
}))
