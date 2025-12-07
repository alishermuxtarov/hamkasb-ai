import { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/i18n'
import { MainLayout } from '@/components/layout/main-layout'
import { QueryProvider } from '@/components/providers/query-provider'

export function generateStaticParams() {
  return locales.map((locale: string) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // Валидация локали
  if (!locales.includes(locale as any)) {
    notFound()
  }

  // Загрузка сообщений для текущей локали
  const messages = await getMessages()

  return (
    <QueryProvider>
      <NextIntlClientProvider messages={messages}>
        <MainLayout>{children}</MainLayout>
      </NextIntlClientProvider>
    </QueryProvider>
  )
}

