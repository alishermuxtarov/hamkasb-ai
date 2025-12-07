// Shared types will be defined here
export type AgentId = 
  | 'librarian'
  | 'docflow'
  | 'kyc'
  | 'financier'
  | 'hr'
  | 'support'
  | 'marketer'
  | 'pr'
  | 'designer'
  | 'smm'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCalls?: unknown[]
  toolResults?: unknown[]
  metadata?: Record<string, unknown>
  createdAt: Date
}

export interface ChatSession {
  id: string
  agentId: AgentId
  userId?: string
  title?: string
  createdAt: Date
  updatedAt: Date
}

