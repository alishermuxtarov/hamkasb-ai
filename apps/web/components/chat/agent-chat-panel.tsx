'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Send,
  Loader2,
  Bot,
  User,
  MessageSquare,
  Plus,
  X,
  History,
  Mic,
  MicOff,
  Volume2,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatSession {
  id: string
  title: string
  lastMessage?: string
  timestamp: Date | string
  messageCount?: number
  updatedAt?: string
  createdAt?: string
}

interface AgentChatPanelProps {
  /** ID агента для API запросов */
  agentId: string
  /** Название агента для отображения */
  agentName: string
  /** URL для SSE запросов (по умолчанию `/api/chat/${agentId}`) */
  apiUrl?: string
  /** Предложения для первого промпта */
  promptSuggestions?: string[]
  /** Ширина панели (по умолчанию 400px) */
  width?: number
  /** Режим позиционирования: 'fixed' для закрепления справа, 'relative' для интеграции в layout */
  position?: 'fixed' | 'relative'
  /** Callback при создании новой сессии */
  onNewSession?: () => void
  /** Callback при выборе сессии */
  // eslint-disable-next-line no-unused-vars
  onSessionSelect?: (sessionId: string) => void
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | null
  createdAt?: string
}

export function AgentChatPanel({
  agentId,
  agentName,
  apiUrl,
  promptSuggestions = [],
  width = 400,
  position = 'fixed',
  onNewSession,
  onSessionSelect,
}: AgentChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(true)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [forceNewSession, setForceNewSession] = useState(false)
  
  // Audio states
  const [isRecording, setIsRecording] = useState(false)
  const [isTransliterating, setIsTransliterating] = useState(false)
  const recognitionRef = useRef<any>(null)
  const synthesisRef = useRef<any>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput } =
    useChat({
      api: apiUrl || `/api/chat/${agentId}`,
      body: {
        sessionId: forceNewSession ? undefined : (selectedSessionId || undefined),
        forceNew: forceNewSession,
      },
      onError: (error) => {
        console.error('Chat error:', error)
      },
      onFinish: () => {
        // После отправки сообщения сбрасываем флаг принудительного создания
        if (forceNewSession) {
          setForceNewSession(false)
          // Перезагружаем сессии, чтобы получить новую сессию
          loadSessions()
        }
      },
    })

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for Speech Recognition support
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition() as any
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = 'ru-RU'

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('')
          setInput(transcript)
        }

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsRecording(false)
          setIsTransliterating(false)
        }

        recognition.onend = () => {
          setIsRecording(false)
          setIsTransliterating(false)
        }

        recognitionRef.current = recognition
      }

      // Speech Synthesis for transliteration
      if ('speechSynthesis' in window) {
        synthesisRef.current = (window as any).speechSynthesis
      }
    }
  }, [setInput])

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [agentId])

  // Load last session if exists and is recent (< 30 minutes)
  // Но только если не установлен флаг принудительного создания новой сессии
  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId && !forceNewSession) {
      const lastSession = sessions[0]
      if (lastSession && lastSession.updatedAt) {
        const lastUpdate = new Date(lastSession.updatedAt)
        const now = new Date()
        const diffMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60)
        
        if (diffMinutes < 30 && lastSession.id) {
          // Auto-load last session if it's recent
          handleSessionSelect(lastSession.id)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, forceNewSession])

  // Load messages when session is selected
  useEffect(() => {
    if (selectedSessionId) {
      loadSessionMessages(selectedSessionId)
    }
  }, [selectedSessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSessions = async () => {
    setIsLoadingSessions(true)
    try {
      const response = await fetch(`/api/chat/${agentId}/sessions`)
      if (response.ok) {
        const data = await response.json()
        const formattedSessions: ChatSession[] = (data.sessions || []).map((s: any) => ({
          id: s.id,
          title: s.title || 'New Chat',
          lastMessage: s.lastMessage,
          timestamp: new Date(s.updatedAt || s.createdAt),
          messageCount: s.messageCount || 0,
          updatedAt: s.updatedAt,
          createdAt: s.createdAt,
        }))
        setSessions(formattedSessions)
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const loadSessionMessages = async (sessionId: string) => {
    setIsLoadingMessages(true)
    try {
      const response = await fetch(`/api/chat/${agentId}/sessions/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        const sessionMessages = (data.messages || []).map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
        }))
        
        // Convert to useChat format
        const formattedMessages = sessionMessages
          .filter((msg: ChatMessage) => msg.role === 'user' || msg.role === 'assistant')
          .map((msg: ChatMessage) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content || '',
          }))
        
        setMessages(formattedMessages as any)
      }
    } catch (error) {
      console.error('Error loading session messages:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return
    handleSubmit(e)
  }

  const handleNewSession = () => {
    setSelectedSessionId(null)
    setMessages([])
    setInput('')
    setForceNewSession(true) // Устанавливаем флаг для принудительного создания новой сессии
    onNewSession?.()
  }

  const handleSessionSelect = async (sessionId: string) => {
    setSelectedSessionId(sessionId)
    setShowHistory(false)
    await loadSessionMessages(sessionId)
    onSessionSelect?.(sessionId)
  }

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/${agentId}/sessions/${sessionId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setSessions(sessions.filter((s) => s.id !== sessionId))
        if (selectedSessionId === sessionId) {
          handleNewSession()
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  // Audio: Start/Stop transliteration (speech-to-text in real-time)
  const toggleTransliteration = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Ваш браузер не поддерживает распознавание речи')
      return
    }

    if (isTransliterating) {
      recognitionRef.current.stop()
      setIsTransliterating(false)
    } else {
      setIsTransliterating(true)
      recognitionRef.current.start()
    }
  }, [isTransliterating])

  // Audio: Start/Stop recording (record, then transcribe and send)
  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Ваш браузер не поддерживает распознавание речи')
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      setIsRecording(true)
      
      // Store the final transcript to send
      let finalTranscript = ''
      const originalOnResult = recognitionRef.current.onresult
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('')
        setInput(transcript)
        if (event.results[event.results.length - 1].isFinal) {
          finalTranscript = transcript
        }
        if (originalOnResult) originalOnResult(event)
      }
      
      const originalOnEnd = recognitionRef.current.onend
      recognitionRef.current.onend = () => {
        setIsRecording(false)
        // Auto-send the transcribed text
        if (finalTranscript.trim()) {
          setInput(finalTranscript)
          // Trigger submit after a short delay
          setTimeout(() => {
            const form = inputRef.current?.form
            if (form) {
              const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
              form.dispatchEvent(submitEvent)
            }
          }, 100)
        }
        if (originalOnEnd) originalOnEnd()
      }
      
      recognitionRef.current.start()
    }
  }, [isRecording, setInput])

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diff = now.getTime() - dateObj.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes} мин назад`
    if (hours < 24) return `${hours} ч назад`
    return `${days} дн назад`
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 bottom-4 h-12 w-12 rounded-full shadow-lg z-50"
        size="icon"
        aria-label="Открыть чат"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>
    )
  }

  const positionClasses = position === 'fixed' 
    ? 'fixed right-0 top-0 h-screen' 
    : 'h-full'

  return (
    <div
      className={cn(
        positionClasses,
        'bg-background border-l shadow-lg z-40 flex flex-col flex-shrink-0'
      )}
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <div className="border-b p-4 bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{agentName}</h3>
              <p className="text-xs text-muted-foreground">AI Ассистент</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="flex-1 text-xs"
          >
            <History className="h-3 w-3 mr-1" />
            История
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewSession}
            className="flex-1 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Новый чат
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="flex-1 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Скрыть
          </Button>
        </div>
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <Sheet open={showHistory} onOpenChange={setShowHistory}>
          <SheetContent side="right" className="w-80 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>История чатов</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {isLoadingSessions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    Нет сохраненных чатов
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => handleSessionSelect(session.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg transition-colors cursor-pointer group',
                        'hover:bg-accent hover:text-accent-foreground',
                        selectedSessionId === session.id && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium truncate flex-1">
                          {session.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteSession(session.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      {session.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate mb-2">
                          {session.lastMessage}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(session.timestamp)}
                        </span>
                        {session.messageCount !== undefined && (
                          <Badge variant="secondary" className="text-xs">
                            {session.messageCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages.length === 0 && promptSuggestions.length > 0 && (
            <div className="space-y-3">
              <div className="text-center text-sm text-muted-foreground mb-4">
                Начните разговор с {agentName}
              </div>
              <div className="space-y-2">
                {promptSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 && promptSuggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Начните разговор</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Задайте вопрос или начните диалог с агентом.
              </p>
            </div>
          ) : null}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'flex flex-col gap-1 max-w-[80%]',
                  message.role === 'user' && 'items-end'
                )}
              >
                <div
                  className={cn(
                    'rounded-2xl px-3 py-2 text-sm shadow-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:my-1 prose-headings:text-sm prose-h1:text-base prose-h2:text-sm prose-h3:text-sm prose-h4:text-xs prose-p:my-1 prose-p:text-sm prose-ul:my-1 prose-ol:my-1 prose-li:text-sm prose-strong:text-sm prose-code:text-xs prose-pre:text-xs prose-blockquote:text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="leading-relaxed whitespace-pre-wrap text-sm">
                      {message.content}
                    </p>
                  )}
                </div>
              </div>
              {message.role === 'user' && (
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="bg-secondary">
                    <User className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-3.5 w-3.5" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-background p-3 space-y-2">
        {/* Audio Controls */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={isTransliterating ? 'default' : 'outline'}
            size="sm"
            onClick={toggleTransliteration}
            disabled={isRecording || isLoading}
            className="flex-1 text-xs"
          >
            {isTransliterating ? (
              <>
                <MicOff className="h-3 w-3 mr-1" />
                Остановить
              </>
            ) : (
              <>
                <Volume2 className="h-3 w-3 mr-1" />
                Транслитерация
              </>
            )}
          </Button>
          <Button
            type="button"
            variant={isRecording ? 'destructive' : 'outline'}
            size="sm"
            onClick={toggleRecording}
            disabled={isTransliterating || isLoading}
            className="flex-1 text-xs"
          >
            {isRecording ? (
              <>
                <MicOff className="h-3 w-3 mr-1 animate-pulse" />
                Запись...
              </>
            ) : (
              <>
                <Mic className="h-3 w-3 mr-1" />
                Записать
              </>
            )}
          </Button>
        </div>

        {/* Text Input */}
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder={
              isTransliterating
                ? 'Говорите...'
                : isRecording
                ? 'Запись...'
                : 'Введите сообщение...'
            }
            disabled={isLoading || (isRecording && !isTransliterating)}
            className="flex-1 h-10 text-sm"
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
            disabled={isLoading || !input.trim() || isRecording}
            size="default"
            className="h-10 px-4"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

