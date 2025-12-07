'use client'

import React from 'react'
import { ChatInterface } from '@/components/chat/chat-interface'
import { Palette } from 'lucide-react'

export default function DesignerPage() {
  return (
    <div className="flex h-full">
      <div className="flex-1">
        <div className="border-b p-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-2">
              <Palette className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Дизайнер</h1>
              <p className="text-sm text-muted-foreground">
                Создание визуального контента и графики
              </p>
            </div>
          </div>
        </div>
        <ChatInterface agentId="designer" className="h-[calc(100vh-8rem)]" />
      </div>
    </div>
  )
}
