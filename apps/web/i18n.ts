import { getRequestConfig } from 'next-intl/server'

// Поддерживаемые языки
export const locales = ['ru', 'uz', 'en', 'kaa'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'ru'

export default getRequestConfig(async ({ requestLocale }) => {
  // Получаем локаль из запроса
  let locale = await requestLocale
  
  // Если локаль не получена, используем дефолтную
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale
  }

  return {
    locale: locale as Locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})

