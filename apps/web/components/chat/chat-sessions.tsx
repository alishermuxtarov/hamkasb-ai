'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Trash2, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

interface ChatSessionsProps {
  agentId: string
  // eslint-disable-next-line no-unused-vars
  onSelectSession: (sessionId: string) => void
  selectedSessionId?: string
}

export function ChatSessions({
  agentId,
  onSelectSession,
  selectedSessionId,
}: ChatSessionsProps) {
  // agentId and selectedSessionId are used for future API calls
  void agentId
  void selectedSessionId
  const t = useTranslations('chat')
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch sessions from API
    // For now, using mock data
    setSessions([
      {
        id: '1',
        title: 'Новый чат',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])
    setLoading(false)
  }, [agentId])

  const handleNewChat = () => {
    onSelectSession('')
  }

  const handleDeleteSession = async (sessionId: string) => {
    // TODO: Delete session via API
    setSessions(sessions.filter((s) => s.id !== sessionId))
    if (selectedSessionId === sessionId) {
      onSelectSession('')
    }
  }

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Загрузка...</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Button onClick={handleNewChat} className="w-full" variant="default">
          <MessageSquare className="h-4 w-4 mr-2" />
          {t('newSession')}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            {t('noSessions')}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent group',
                  selectedSessionId === session.id && 'bg-accent'
                )}
                onClick={() => onSelectSession(session.id)}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{session.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteSession(session.id)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

