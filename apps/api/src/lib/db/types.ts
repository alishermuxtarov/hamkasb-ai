/**
 * Типы для работы с БД
 * Автоматически генерируются из схем Drizzle
 */

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import {
  chatSessions,
  chatMessages,
  documents,
  documentCatalogs,
  documentChunks,
} from './schema'

// Chat types
export type ChatSession = InferSelectModel<typeof chatSessions>
export type NewChatSession = InferInsertModel<typeof chatSessions>

export type ChatMessage = InferSelectModel<typeof chatMessages>
export type NewChatMessage = InferInsertModel<typeof chatMessages>

// Document types
export type Document = InferSelectModel<typeof documents>
export type NewDocument = InferInsertModel<typeof documents>

export type DocumentCatalog = InferSelectModel<typeof documentCatalogs>
export type NewDocumentCatalog = InferInsertModel<typeof documentCatalogs>

export type DocumentChunk = InferSelectModel<typeof documentChunks>
export type NewDocumentChunk = InferInsertModel<typeof documentChunks>

