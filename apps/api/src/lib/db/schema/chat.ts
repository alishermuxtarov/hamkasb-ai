import { pgTable, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

/**
 * Сессии чата
 */
export const chatSessions = pgTable(
  'chat_sessions',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    agentId: text('agent_id').notNull(),
    userId: text('user_id'),
    title: text('title'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    agentIdIdx: index('idx_chat_sessions_agent').on(table.agentId),
  })
)

/**
 * Сообщения чата
 */
export const chatMessages = pgTable(
  'chat_messages',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    chatSessionId: text('chat_session_id')
      .notNull()
      .references(() => chatSessions.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'user' | 'assistant' | 'system' | 'tool'
    content: text('content'),
    toolCalls: jsonb('tool_calls'),
    toolResults: jsonb('tool_results'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    sessionIdIdx: index('idx_chat_messages_session').on(table.chatSessionId),
    createdAtIdx: index('idx_chat_messages_created').on(table.createdAt),
  })
)

/**
 * Relations для чата
 */
export const chatSessionsRelations = relations(chatSessions, ({ many }) => ({
  messages: many(chatMessages),
}))

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.chatSessionId],
    references: [chatSessions.id],
  }),
}))

