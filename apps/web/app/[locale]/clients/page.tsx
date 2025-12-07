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
import { Users, UserPlus, Search, Phone, Mail, AlertCircle, MessageSquare } from 'lucide-react'
import { AgentChatPanel } from '@/components/chat/agent-chat-panel'

interface Client {
  id: string
  name: string
  phone: string
  email: string
  status: 'active' | 'inactive' | 'pending'
  kycStatus: 'verified' | 'pending' | 'rejected'
  registrationDate: string
}

const mockClients: Client[] = [
  {
    id: '1',
    name: 'Иванов Иван Иванович',
    phone: '+998 90 123 45 67',
    email: 'ivanov@example.com',
    status: 'active',
    kycStatus: 'verified',
    registrationDate: '2024-01-10',
  },
  {
    id: '2',
    name: 'Петров Петр Петрович',
    phone: '+998 90 234 56 78',
    email: 'petrov@example.com',
    status: 'active',
    kycStatus: 'verified',
    registrationDate: '2024-01-15',
  },
  {
    id: '3',
    name: 'Сидоров Сидор Сидорович',
    phone: '+998 90 345 67 89',
    email: 'sidorov@example.com',
    status: 'inactive',
    kycStatus: 'pending',
    registrationDate: '2024-01-20',
  },
  {
    id: '4',
    name: 'Ахмедова Амина Ахмедовна',
    phone: '+998 90 456 78 90',
    email: 'ahmedova@example.com',
    status: 'active',
    kycStatus: 'verified',
    registrationDate: '2024-01-12',
  },
  {
    id: '5',
    name: 'Каримов Карим Каримович',
    phone: '+998 90 567 89 01',
    email: 'karimov@example.com',
    status: 'pending',
    kycStatus: 'pending',
    registrationDate: '2024-01-25',
  },
]

const statusConfig = {
  active: { label: 'Активный', variant: 'default' as const },
  inactive: { label: 'Неактивный', variant: 'secondary' as const },
  pending: { label: 'На проверке', variant: 'outline' as const },
}

const kycStatusConfig = {
  verified: { label: 'Верифицирован', variant: 'default' as const },
  pending: { label: 'На проверке', variant: 'outline' as const },
  rejected: { label: 'Отклонен', variant: 'destructive' as const },
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function ClientsPage() {
  const t = useTranslations()
  const [showChat, setShowChat] = useState(true)

  const activeCount = mockClients.filter((c) => c.status === 'active').length
  const verifiedCount = mockClients.filter((c) => c.kycStatus === 'verified').length

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
        <div className="space-y-8 p-8">
      {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Клиенты</h1>
            <p className="text-muted-foreground">Управление клиентской базой и KYC проверки</p>
          </div>
          <div className="flex gap-2">
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
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Поиск
            </Button>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Добавить клиента
            </Button>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего клиентов</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockClients.length}</div>
            <p className="text-xs text-muted-foreground">в базе данных</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активных</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">клиентов</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Верифицировано</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedCount}</div>
            <p className="text-xs text-muted-foreground">KYC проверок</p>
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

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Список клиентов</CardTitle>
              <CardDescription>Управление клиентской базой и KYC статусами</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Поиск клиентов..." className="pl-10 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Контакты</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>KYC Статус</TableHead>
                <TableHead>Дата регистрации</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockClients.map((client) => {
                const status = statusConfig[client.status]
                const kycStatus = kycStatusConfig[client.kycStatus]
                return (
                  <TableRow key={client.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{client.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{client.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={kycStatus.variant}>{kycStatus.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.registrationDate}
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
            agentId="kyc"
            agentName="KYC Сотрудник"
            promptSuggestions={[
              'Покажи всех активных клиентов',
              'Какие клиенты требуют верификации?',
              'Найди клиента по имени',
            ]}
            position="relative"
          />
        </div>
      )}
    </div>
  )
}
