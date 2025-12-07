'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import {
  Globe,
  LogOut,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { locales, type Locale } from '@/i18n'

export function Navbar() {
  const t = useTranslations('navbar')
  const router = useRouter()
  const pathname = usePathname()

  // Получаем текущую локаль из пути
  const currentLocale =
    (pathname?.split('/')[1] as Locale) || 'ru'

  const changeLocale = (locale: Locale) => {
    const pathWithoutLocale = pathname?.replace(/^\/[^/]+/, '') || ''
    const newPath = `/${locale}${pathWithoutLocale || '/dashboard'}`
    router.push(newPath)
  }

  const langLabels: Record<Locale, string> = {
    ru: 'Русский',
    uz: "O'zbekcha",
    en: 'English',
    kaa: 'Qaraqalpaqsha',
  }

  const getUserInitials = () => {
    return 'ИИ'
  }

  return (
    <nav className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <div className="flex flex-1 items-center gap-4">
        {/* Spacer for sidebar */}
      </div>

      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{langLabels[currentLocale]}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Выберите язык</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {locales.map((locale) => (
              <DropdownMenuItem
                key={locale}
                onClick={() => changeLocale(locale)}
                className={currentLocale === locale ? 'bg-accent' : ''}
              >
                {langLabels[locale]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">Иван Иванов</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Иван Иванов</p>
                <p className="text-xs leading-none text-muted-foreground">
                  ivan.ivanov@example.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <Settings className="h-4 w-4" />
              {t('profile')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
