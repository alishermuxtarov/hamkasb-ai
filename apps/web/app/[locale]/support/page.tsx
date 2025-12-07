'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Headphones, MessageSquare, Clock, CheckCircle2, Search, AlertCircle } from 'lucide-react'
import { AgentChatPanel } from '@/components/chat/agent-chat-panel'

interface Ticket {
  id: string
  number: string
  client: string
  subject: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'new' | 'in-progress' | 'resolved' | 'closed'
  createdAt: string
  updatedAt: string
  assignee?: string
}

const mockTickets: Ticket[] = [
  {
    id: '1',
    number: 'TICKET-2024-001',
    client: 'Иванов И.И.',
    subject: 'Проблема с доступом к системе',
    priority: 'high',
    status: 'in-progress',
    createdAt: '2024-01-25 10:30',
    updatedAt: '2024-01-25 14:20',
    assignee: 'Сотрудник поддержки',
  },
  {
    id: '2',
    number: 'TICKET-2024-002',
    client: 'Петров П.П.',
    subject: 'Вопрос по тарифам',
    priority: 'medium',
    status: 'new',
    createdAt: '2024-01-25 11:15',
    updatedAt: '2024-01-25 11:15',
  },
  {
    id: '3',
    number: 'TICKET-2024-003',
    client: 'Сидоров С.С.',
    subject: 'Запрос на восстановление пароля',
    priority: 'low',
    status: 'resolved',
    createdAt: '2024-01-24 09:00',
    updatedAt: '2024-01-24 10:30',
    assignee: 'Сотрудник поддержки',
  },
  {
    id: '4',
    number: 'TICKET-2024-004',
    client: 'Ахмедова А.А.',
    subject: 'Критическая ошибка в работе системы',
    priority: 'urgent',
    status: 'in-progress',
    createdAt: '2024-01-25 15:45',
    updatedAt: '2024-01-25 16:00',
    assignee: 'Старший специалист',
  },
  {
    id: '5',
    number: 'TICKET-2024-005',
    client: 'Каримов К.К.',
    subject: 'Предложение по улучшению',
    priority: 'low',
    status: 'closed',
    createdAt: '2024-01-23 12:20',
    updatedAt: '2024-01-24 16:45',
    assignee: 'Менеджер',
  },
]

const statusConfig = {
  new: { label: 'Новое', variant: 'default' as const },
  'in-progress': { label: 'В работе', variant: 'outline' as const },
  resolved: { label: 'Решено', variant: 'secondary' as const },
  closed: { label: 'Закрыто', variant: 'outline' as const },
}

const priorityConfig = {
  low: { label: 'Низкий', variant: 'secondary' as const, color: 'text-blue-600' },
  medium: { label: 'Средний', variant: 'outline' as const, color: 'text-yellow-600' },
  high: { label: 'Высокий', variant: 'default' as const, color: 'text-orange-600' },
  urgent: { label: 'Срочно', variant: 'destructive' as const, color: 'text-red-600' },
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function SupportPage() {
  const t = useTranslations()
  const [showChat, setShowChat] = useState(true)

  const newCount = mockTickets.filter((t) => t.status === 'new').length
  const inProgressCount = mockTickets.filter((t) => t.status === 'in-progress').length
  const resolvedCount = mockTickets.filter((t) => t.status === 'resolved').length
  const totalCount = mockTickets.length

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
        <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Служба поддержки</h1>
          <p className="text-muted-foreground">Управление обращениями клиентов</p>
        </div>
        <Button variant="outline" onClick={() => setShowChat(!showChat)}>
          {showChat ? (
            <>
              <MessageSquare className="h-4 w-4 mr-2" />
              Скрыть чат
            </>
          ) : (
            <>
              <MessageSquare className="h-4 w-4 mr-2" />
              Открыть чат
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Новые обращения</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newCount}</div>
            <p className="text-xs text-muted-foreground">требуют внимания</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">В обработке</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">активных обращений</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Решено</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedCount}</div>
            <p className="text-xs text-muted-foreground">обращений</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего</CardTitle>
            <Headphones className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">обращений</p>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Notice */}
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <CardTitle className="text-amber-900 dark:text-amber-100">
                {t('mock.comingSoon')}
              </CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-300">
                {t('mock.description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Обращения</CardTitle>
              <CardDescription>Список обращений клиентов</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Поиск..." className="pl-10 w-64" />
              </div>
              <Button>Создать обращение</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Номер</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Тема</TableHead>
                <TableHead>Приоритет</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Исполнитель</TableHead>
                <TableHead>Обновлено</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTickets.map((ticket) => {
                const status = statusConfig[ticket.status]
                const priority = priorityConfig[ticket.priority]
                return (
                  <TableRow key={ticket.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(ticket.client)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium font-mono text-sm">
                      {ticket.number}
                    </TableCell>
                    <TableCell>{ticket.client}</TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate">{ticket.subject}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={priority.variant} className={priority.color}>
                        {priority.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ticket.assignee || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {ticket.updatedAt}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="flex-shrink-0">
          <AgentChatPanel
            agentId="support"
            agentName="Служба поддержки"
            promptSuggestions={[
              'Покажи новые обращения',
              'Какие обращения требуют внимания?',
              'Найди обращение по номеру',
            ]}
            position="relative"
          />
        </div>
      )}
    </div>
  )
}
