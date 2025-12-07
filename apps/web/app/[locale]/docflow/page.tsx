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
import { AgentChatPanel } from '@/components/chat/agent-chat-panel'
import { Clock, CheckCircle2, Search, ArrowDown, ArrowUp, AlertCircle, MessageSquare } from 'lucide-react'

interface Document {
  id: string
  number: string
  type: 'incoming' | 'outgoing'
  subject: string
  sender: string
  date: string
  status: 'pending' | 'in-progress' | 'completed' | 'overdue'
  deadline?: string
}

const mockDocuments: Document[] = [
  {
    id: '1',
    number: 'ВХ-2024-001',
    type: 'incoming',
    subject: 'Запрос о предоставлении информации',
    sender: 'Министерство экономики',
    date: '2024-01-15',
    status: 'in-progress',
    deadline: '2024-02-15',
  },
  {
    id: '2',
    number: 'ИСХ-2024-045',
    type: 'outgoing',
    subject: 'Ответ на запрос №123',
    sender: 'Наша организация',
    date: '2024-01-20',
    status: 'completed',
  },
  {
    id: '3',
    number: 'ВХ-2024-002',
    type: 'incoming',
    subject: 'Уведомление о совещании',
    sender: 'Правительство РУз',
    date: '2024-01-18',
    status: 'pending',
    deadline: '2024-01-25',
  },
  {
    id: '4',
    number: 'ИСХ-2024-046',
    type: 'outgoing',
    subject: 'Предложение о сотрудничестве',
    sender: 'Наша организация',
    date: '2024-01-22',
    status: 'in-progress',
  },
  {
    id: '5',
    number: 'ВХ-2024-003',
    type: 'incoming',
    subject: 'Инструкция по заполнению отчетности',
    sender: 'Налоговый комитет',
    date: '2024-01-10',
    status: 'overdue',
    deadline: '2024-01-20',
  },
]

const statusConfig = {
  pending: { label: 'На рассмотрении', variant: 'secondary' as const },
  'in-progress': { label: 'В работе', variant: 'default' as const },
  completed: { label: 'Исполнено', variant: 'outline' as const },
  overdue: { label: 'Просрочено', variant: 'destructive' as const },
}

export default function DocflowPage() {
  const t = useTranslations()
  const [showChat, setShowChat] = useState(true)

  const incomingCount = mockDocuments.filter((d) => d.type === 'incoming').length
  const outgoingCount = mockDocuments.filter((d) => d.type === 'outgoing').length
  const pendingCount = mockDocuments.filter((d) => d.status === 'pending').length
  const completedCount = mockDocuments.filter((d) => d.status === 'completed').length

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
        <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Канцелярия</h1>
          <p className="text-muted-foreground">
            Работа с входящей и исходящей корреспонденцией
          </p>
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
            <CardTitle className="text-sm font-medium">Входящие</CardTitle>
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incomingCount}</div>
            <p className="text-xs text-muted-foreground">документов</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Исходящие</CardTitle>
            <ArrowUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outgoingCount}</div>
            <p className="text-xs text-muted-foreground">документов</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">На рассмотрении</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">документов</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Исполнено</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">документов</p>
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

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Документооборот</CardTitle>
              <CardDescription>Список входящих и исходящих документов</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Поиск..." className="pl-10 w-64" />
              </div>
              <Button>Создать документ</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Номер</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Тема</TableHead>
                <TableHead>Отправитель</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Срок</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDocuments.map((doc) => {
                const status = statusConfig[doc.status]
                return (
                  <TableRow key={doc.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{doc.number}</TableCell>
                    <TableCell>
                      {doc.type === 'incoming' ? (
                        <Badge variant="secondary" className="gap-1">
                          <ArrowDown className="h-3 w-3" />
                          Входящий
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <ArrowUp className="h-3 w-3" />
                          Исходящий
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate">{doc.subject}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{doc.sender}</TableCell>
                    <TableCell>{doc.date}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.deadline || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
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
            agentId="docflow"
            agentName="Канцелярия"
            promptSuggestions={[
              'Покажи все входящие документы',
              'Какие документы требуют внимания?',
              'Найди документ по номеру',
            ]}
            position="relative"
          />
        </div>
      )}
    </div>
  )
}
