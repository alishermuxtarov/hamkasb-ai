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
import { UserCircle, Users, UserPlus, Briefcase, Search, AlertCircle, Mail, Phone, MessageSquare } from 'lucide-react'
import { AgentChatPanel } from '@/components/chat/agent-chat-panel'

interface Employee {
  id: string
  name: string
  position: string
  department: string
  email: string
  phone: string
  status: 'active' | 'on-leave' | 'terminated'
  hireDate: string
}

const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Иванов Иван Иванович',
    position: 'Менеджер по продажам',
    department: 'Отдел продаж',
    email: 'ivanov@company.com',
    phone: '+998 90 123 45 67',
    status: 'active',
    hireDate: '2023-01-15',
  },
  {
    id: '2',
    name: 'Петрова Мария Петровна',
    position: 'Бухгалтер',
    department: 'Финансы',
    email: 'petrova@company.com',
    phone: '+998 90 234 56 78',
    status: 'active',
    hireDate: '2023-03-20',
  },
  {
    id: '3',
    name: 'Сидоров Сидор Сидорович',
    position: 'Frontend разработчик',
    department: 'IT',
    email: 'sidorov@company.com',
    phone: '+998 90 345 67 89',
    status: 'active',
    hireDate: '2023-06-10',
  },
  {
    id: '4',
    name: 'Ахмедова Амина Ахмедовна',
    position: 'HR специалист',
    department: 'Кадры',
    email: 'ahmedova@company.com',
    phone: '+998 90 456 78 90',
    status: 'on-leave',
    hireDate: '2023-02-05',
  },
  {
    id: '5',
    name: 'Каримов Карим Каримович',
    position: 'Маркетолог',
    department: 'Маркетинг',
    email: 'karimov@company.com',
    phone: '+998 90 567 89 01',
    status: 'active',
    hireDate: '2023-09-12',
  },
]

const statusConfig = {
  active: { label: 'Работает', variant: 'default' as const },
  'on-leave': { label: 'В отпуске', variant: 'outline' as const },
  terminated: { label: 'Уволен', variant: 'destructive' as const },
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const departments = Array.from(new Set(mockEmployees.map((e) => e.department)))

export default function HRPage() {
  const t = useTranslations()
  const [showChat, setShowChat] = useState(true)

  const activeCount = mockEmployees.filter((e) => e.status === 'active').length
  const departmentsCount = departments.length

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
        <div className="space-y-8 p-8">
      {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Кадры</h1>
            <p className="text-muted-foreground">Управление персоналом</p>
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
              Добавить сотрудника
            </Button>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего сотрудников</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEmployees.length}</div>
            <p className="text-xs text-muted-foreground">в организации</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активных</CardTitle>
            <UserCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">сотрудников</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Отделов</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentsCount}</div>
            <p className="text-xs text-muted-foreground">в организации</p>
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

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Сотрудники</CardTitle>
              <CardDescription>Список сотрудников организации</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Поиск сотрудников..." className="pl-10 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Сотрудник</TableHead>
                <TableHead>Должность</TableHead>
                <TableHead>Отдел</TableHead>
                <TableHead>Контакты</TableHead>
                <TableHead>Дата найма</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockEmployees.map((employee) => {
                const status = statusConfig[employee.status]
                return (
                  <TableRow key={employee.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(employee.name)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell className="text-muted-foreground">{employee.position}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{employee.department}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">{employee.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{employee.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{employee.hireDate}</TableCell>
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
            agentId="hr"
            agentName="HR Специалист"
            promptSuggestions={[
              'Покажи всех сотрудников',
              'Какие отделы есть в организации?',
              'Найди сотрудника по имени',
            ]}
            position="relative"
          />
        </div>
      )}
    </div>
  )
}
