'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
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
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentCard {
  id: string
  nameKey: string
  descriptionKey: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  status: 'ready' | 'coming-soon'
  color?: string
}

export default function DashboardPage() {
  const t = useTranslations()
  const router = useRouter()

  const agentCards: AgentCard[] = [
    {
      id: 'librarian',
      nameKey: 'agents.librarian.name',
      descriptionKey: 'agents.librarian.description',
      icon: FileText,
      href: '/documents',
      status: 'ready',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      id: 'docflow',
      nameKey: 'agents.docflow.name',
      descriptionKey: 'agents.docflow.description',
      icon: FolderKanban,
      href: '/docflow',
      status: 'coming-soon',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      id: 'kyc',
      nameKey: 'agents.kyc.name',
      descriptionKey: 'agents.kyc.description',
      icon: Users,
      href: '/clients',
      status: 'coming-soon',
      color: 'bg-green-500/10 text-green-600 dark:text-green-400',
    },
    {
      id: 'financier',
      nameKey: 'agents.financier.name',
      descriptionKey: 'agents.financier.description',
      icon: Wallet,
      href: '/finance',
      status: 'coming-soon',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'hr',
      nameKey: 'agents.hr.name',
      descriptionKey: 'agents.hr.description',
      icon: UserCircle,
      href: '/hr',
      status: 'coming-soon',
      color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    },
    {
      id: 'support',
      nameKey: 'agents.support.name',
      descriptionKey: 'agents.support.description',
      icon: Headphones,
      href: '/support',
      status: 'coming-soon',
      color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    },
    {
      id: 'pr',
      nameKey: 'agents.pr.name',
      descriptionKey: 'agents.pr.description',
      icon: Megaphone,
      href: '/pr',
      status: 'coming-soon',
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
    {
      id: 'designer',
      nameKey: 'agents.designer.name',
      descriptionKey: 'agents.designer.description',
      icon: Palette,
      href: '/designer',
      status: 'coming-soon',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'smm',
      nameKey: 'agents.smm.name',
      descriptionKey: 'agents.smm.description',
      icon: Share2,
      href: '/smm',
      status: 'coming-soon',
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
  ]

  return (
    <div className="flex-1 space-y-8 p-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">{t('dashboard.selectAgent')}</p>
          </div>
        </div>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agentCards.map((agent) => {
          const Icon = agent.icon
          return (
            <Card
              key={agent.id}
              className={cn(
                'group relative overflow-hidden transition-all duration-200',
                'hover:shadow-lg hover:border-primary/50',
                agent.status === 'ready' && 'cursor-pointer'
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={cn('rounded-lg p-2.5', agent.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {agent.status === 'ready' ? (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                      Готов
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Скоро</Badge>
                  )}
                </div>
                <CardTitle className="mt-4 text-xl">{t(agent.nameKey)}</CardTitle>
                <CardDescription className="mt-1.5 text-sm leading-relaxed">
                  {t(agent.descriptionKey)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {agent.status === 'ready' ? (
                  <Button
                    onClick={() => router.push(agent.href)}
                    className="w-full group-hover:bg-primary/90"
                  >
                    {t('common.open')}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                ) : (
                  <Button variant="outline" disabled className="w-full">
                    {t('common.comingSoon')}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
