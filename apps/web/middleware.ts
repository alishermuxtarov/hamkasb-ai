import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'

export default createMiddleware({
  // Список поддерживаемых локалей
  locales,
  // Локаль по умолчанию
  defaultLocale,
  // Префикс локали в URL (false = /ru/page, true = /page)
  localePrefix: 'as-needed',
})

export const config = {
  // Матчинг только для определенных путей
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}

