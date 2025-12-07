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
import { Wallet, TrendingUp, TrendingDown, DollarSign, Search, AlertCircle, ArrowUpRight, ArrowDownRight, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AgentChatPanel } from '@/components/chat/agent-chat-panel'

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  status: 'completed' | 'pending' | 'cancelled'
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2024-01-25',
    description: 'Оплата услуг поставщика',
    amount: 150000,
    type: 'expense',
    category: 'Закупки',
    status: 'completed',
  },
  {
    id: '2',
    date: '2024-01-24',
    description: 'Поступление от клиента',
    amount: 500000,
    type: 'income',
    category: 'Продажи',
    status: 'completed',
  },
  {
    id: '3',
    date: '2024-01-23',
    description: 'Зарплата сотрудникам',
    amount: 800000,
    type: 'expense',
    category: 'Зарплата',
    status: 'completed',
  },
  {
    id: '4',
    date: '2024-01-22',
    description: 'Оплата аренды офиса',
    amount: 200000,
    type: 'expense',
    category: 'Аренда',
    status: 'pending',
  },
  {
    id: '5',
    date: '2024-01-21',
    description: 'Доход от проекта',
    amount: 1200000,
    type: 'income',
    category: 'Проекты',
    status: 'completed',
  },
]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
  }).format(amount)
}

const statusConfig = {
  completed: { label: 'Завершено', variant: 'default' as const },
  pending: { label: 'В ожидании', variant: 'outline' as const },
  cancelled: { label: 'Отменено', variant: 'destructive' as const },
}

export default function FinancePage() {
  const t = useTranslations()
  const [showChat, setShowChat] = useState(true)

  const totalIncome = mockTransactions
    .filter((t) => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = mockTransactions
    .filter((t) => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpense

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
        <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Финансы</h1>
          <p className="text-muted-foreground">Финансовый анализ и отчетность</p>
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
            <CardTitle className="text-sm font-medium">Доходы</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">За текущий месяц</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Расходы</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
            <p className="text-xs text-muted-foreground">За текущий месяц</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Баланс</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
            <p className="text-xs text-muted-foreground">Текущий баланс</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Транзакции</CardTitle>
            <Wallet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockTransactions.length}</div>
            <p className="text-xs text-muted-foreground">За текущий месяц</p>
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

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Транзакции</CardTitle>
              <CardDescription>История финансовых операций</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Поиск..." className="pl-10 w-64" />
              </div>
              <Button>Создать транзакцию</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((transaction) => {
                const status = statusConfig[transaction.status]
                return (
                  <TableRow key={transaction.id} className="hover:bg-muted/50">
                    <TableCell className="text-muted-foreground">{transaction.date}</TableCell>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{transaction.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-600" />
                        )}
                        <span
                          className={cn(
                            'font-medium',
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          )}
                        >
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
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
            agentId="financier"
            agentName="Финансист"
            promptSuggestions={[
              'Покажи доходы за текущий месяц',
              'Какие транзакции были сегодня?',
              'Рассчитай баланс',
            ]}
            position="relative"
          />
        </div>
      )}
    </div>
  )
}
