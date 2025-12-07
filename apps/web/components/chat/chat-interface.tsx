'use client'

import React, { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useTranslations } from 'next-intl'
import { Send, Loader2, Bot, User, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInterfaceProps {
  agentId: string
  sessionId?: string
  className?: string
}

interface ChatSession {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
  messageCount: number
}

// Mock sessions data
const mockSessions: ChatSession[] = [
  {
    id: '1',
    title: 'Обсуждение проекта',
    lastMessage: 'Спасибо за помощь!',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    messageCount: 12,
  },
  {
    id: '2',
    title: 'Вопросы по документации',
    lastMessage: 'Понял, спасибо',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    messageCount: 8,
  },
  {
    id: '3',
    title: 'Новая идея',
    lastMessage: 'Отличная идея!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    messageCount: 5,
  },
]

export function ChatInterface({
  agentId,
  sessionId,
  className,
}: ChatInterfaceProps) {
  const t = useTranslations('chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [sessions] = useState<ChatSession[]>(mockSessions)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(sessionId || null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } =
    useChat({
      api: `/api/chat/${agentId}`,
      body: {
        sessionId: selectedSessionId,
      },
      stream: false, // Disable streaming - use regular JSON responses
      onError: (error) => {
        console.error('Chat error:', error)
      },
    })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return
    handleSubmit(e)
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes} мин назад`
    if (hours < 24) return `${hours} ч назад`
    return `${days} дн назад`
  }

  const handleNewSession = () => {
    setSelectedSessionId(null)
    setMessages([])
  }

  return (
    <div className={cn('flex h-full', className)}>
      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Начните разговор</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Задайте вопрос или начните диалог с агентом. История сообщений будет сохранена автоматически.
                </p>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-4',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'flex flex-col gap-1.5 max-w-[70%]',
                    message.role === 'user' && 'items-end'
                  )}
                >
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-2.5 shadow-sm',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-secondary">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t bg-background">
          <form onSubmit={onSubmit} className="p-4">
            <div className="flex gap-2 max-w-4xl mx-auto">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder={t('placeholder')}
                disabled={isLoading}
                className="flex-1 h-11"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (input.trim()) {
                      handleSubmit(e as any)
                    }
                  }
                }}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="default"
                className="h-11 px-6"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Sidebar - Chat Sessions */}
      <div className="w-80 border-l bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">{t('sessions')}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewSession}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setSelectedSessionId(session.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selectedSessionId === session.id && 'bg-accent text-accent-foreground'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium truncate flex-1">
                    {session.title}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle delete
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground truncate mb-2">
                  {session.lastMessage}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatTime(session.timestamp)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {session.messageCount}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
