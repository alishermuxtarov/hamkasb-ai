'use client'

import React from 'react'
import { ChatInterface } from '@/components/chat/chat-interface'
import { Megaphone } from 'lucide-react'

export default function PRPage() {
  return (
    <div className="flex h-full">
      <div className="flex-1">
        <div className="border-b p-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <Megaphone className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">PR Специалист</h1>
              <p className="text-sm text-muted-foreground">
                Публичные отношения и коммуникации
              </p>
            </div>
          </div>
        </div>
        <ChatInterface agentId="pr" className="h-[calc(100vh-8rem)]" />
      </div>
    </div>
  )
}
