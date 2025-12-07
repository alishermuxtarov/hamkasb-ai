import { redirect } from 'next/navigation'
import { defaultLocale } from '@/i18n'

export default function Home() {
  // Redirect to default locale page
  // With basePath '/demo', this will redirect to /demo/ru
  redirect(`/${defaultLocale}`)
}

