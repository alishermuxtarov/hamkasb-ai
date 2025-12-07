'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  FileText,
  FolderKanban,
  Users,
  Wallet,
  UserCircle,
  Headphones,
  Megaphone,
  Palette,
  Share2,
  LayoutDashboard,
  Sparkles,
  Home,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

const navigationGroups = [
  {
    id: 'main',
    items: [
      {
        id: 'home',
        labelKey: 'home',
        icon: Home,
        href: '/',
        type: 'page' as const,
      },
      {
        id: 'dashboard',
        labelKey: 'dashboard',
        icon: LayoutDashboard,
        href: '/dashboard',
        type: 'page' as const,
      },
    ],
  },
  {
    id: 'agents',
    labelKey: 'agents',
    items: [
      {
        id: 'documents',
        labelKey: 'documents',
        icon: FileText,
        href: '/documents',
        agentId: 'librarian',
        type: 'page' as const,
        badge: 'ready',
      },
      {
        id: 'docflow',
        labelKey: 'docflow',
        icon: FolderKanban,
        href: '/docflow',
        agentId: 'docflow',
        type: 'page' as const,
      },
      {
        id: 'clients',
        labelKey: 'clients',
        icon: Users,
        href: '/clients',
        agentId: 'kyc',
        type: 'page' as const,
      },
      {
        id: 'finance',
        labelKey: 'finance',
        icon: Wallet,
        href: '/finance',
        agentId: 'financier',
        type: 'page' as const,
      },
      {
        id: 'hr',
        labelKey: 'hr',
        icon: UserCircle,
        href: '/hr',
        agentId: 'hr',
        type: 'page' as const,
      },
      {
        id: 'support',
        labelKey: 'support',
        icon: Headphones,
        href: '/support',
        agentId: 'support',
        type: 'page' as const,
      },
    ],
  },
  {
    id: 'creative',
    labelKey: 'creative',
    items: [
      {
        id: 'pr',
        labelKey: 'pr',
        icon: Megaphone,
        href: '/pr',
        agentId: 'pr',
        type: 'chat' as const,
      },
      {
        id: 'designer',
        labelKey: 'designer',
        icon: Palette,
        href: '/designer',
        agentId: 'designer',
        type: 'chat' as const,
      },
      {
        id: 'smm',
        labelKey: 'smm',
        icon: Share2,
        href: '/smm',
        agentId: 'smm',
        type: 'chat' as const,
      },
    ],
  },
]

export function Sidebar() {
  const t = useTranslations('sidebar')
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === ''
    }
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname?.startsWith(href)
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold leading-none">Hamkasb.AI</h1>
          <p className="text-xs text-muted-foreground">AI Коллега</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="space-y-1 p-4">
          {navigationGroups.map((group, groupIndex) => (
            <React.Fragment key={group.id}>
              {groupIndex > 0 && <Separator className="my-4" />}
              {group.labelKey && (
                <div className="px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t(group.labelKey)}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <button
                      key={item.id}
                      onClick={() => router.push(item.href)}
                      className={cn(
                        'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                        'hover:bg-accent hover:text-accent-foreground',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        active
                          ? 'bg-accent text-accent-foreground shadow-sm'
                          : 'text-muted-foreground'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 shrink-0 transition-colors',
                          active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      />
                      <span className="flex-1 text-left">{t(item.labelKey)}</span>
                      {'badge' in item && item.badge === 'ready' && (
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                      )}
                    </button>
                  )
                })}
              </div>
            </React.Fragment>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  )
}
