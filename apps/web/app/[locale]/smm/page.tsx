'use client'

import React from 'react'
import { ChatInterface } from '@/components/chat/chat-interface'
import { Share2 } from 'lucide-react'

export default function SMMPage() {
  return (
    <div className="flex h-full">
      <div className="flex-1">
        <div className="border-b p-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rose-500/10 p-2">
              <Share2 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">SMM специалист</h1>
              <p className="text-sm text-muted-foreground">
                Социальные медиа и маркетинг
              </p>
            </div>
          </div>
        </div>
        <ChatInterface agentId="smm" className="h-[calc(100vh-8rem)]" />
      </div>
    </div>
  )
}
