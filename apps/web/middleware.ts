import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'

export default createMiddleware({
  // Список поддерживаемых локалей
  locales,
  // Локаль по умолчанию
  defaultLocale,
  // Префикс локали в URL - всегда показывать локаль в URL
  // Это предотвращает конфликты с basePath и редиректами
  localePrefix: 'always',
})

export const config = {
  // Матчинг только для определенных путей
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}

