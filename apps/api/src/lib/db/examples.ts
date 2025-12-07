/**
 * Примеры использования Drizzle ORM
 * Эти примеры показывают best practices для работы с БД
 */

import { getDb } from './index'
import {
  chatSessions,
  chatMessages,
  documents,
  documentChunks,
} from './schema'
import { eq, and, desc, sql } from 'drizzle-orm'

// Пример 1: Создание сессии чата
export async function createChatSession(agentId: string, userId?: string) {
  const db = getDb()

  const [session] = await db
    .insert(chatSessions)
    .values({
      agentId,
      userId,
      title: 'New Chat',
    })
    .returning()

  return session
}

// Пример 2: Получение сессий с сообщениями (с relations)
export async function getChatSessionWithMessages(sessionId: string) {
  const db = getDb()

  // Используем прямой запрос вместо query API для совместимости
  const session = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId))
    .limit(1)

  if (session.length === 0) {
    return null
  }

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.chatSessionId, sessionId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(50)

  return {
    ...session[0],
    messages,
  }
}

// Пример 3: Добавление сообщения
export async function addChatMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system' | 'tool',
  content: string
) {
  const db = getDb()

  const [message] = await db
    .insert(chatMessages)
    .values({
      chatSessionId: sessionId,
      role,
      content,
    })
    .returning()

  return message
}

// Пример 4: Поиск документов с фильтрацией
export async function searchDocuments(filters: {
  catalogId?: string
  clientId?: string
  limit?: number
}) {
  const db = getDb()

  const conditions = []
  if (filters.catalogId) {
    conditions.push(eq(documents.catalogId, filters.catalogId))
  }
  if (filters.clientId) {
    conditions.push(eq(documents.clientId, filters.clientId))
  }

  const results = await db
    .select()
    .from(documents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(filters.limit || 10)
    .orderBy(desc(documents.createdAt))

  return results
}

// Пример 5: Транзакция (создание документа с chunks)
export async function createDocumentWithChunks(
  documentData: {
    filename: string
    originalFilename: string
    mimeType: string
    size: number
    contentText: string
    chunks: Array<{ content: string; chunkIndex: number }>
  }
) {
  const db = getDb()

  // Используем транзакцию для атомарности
  return await db.transaction(async (tx) => {
    // Создаем документ
    const [document] = await tx
      .insert(documents)
      .values({
        filename: documentData.filename,
        originalFilename: documentData.originalFilename,
        mimeType: documentData.mimeType,
        size: documentData.size,
        contentText: documentData.contentText,
      })
      .returning()

    if (!document) {
      throw new Error('Failed to create document')
    }

    // Создаем chunks
    if (documentData.chunks.length > 0) {
      await tx.insert(documentChunks).values(
        documentData.chunks.map((chunk) => ({
          documentId: document.id,
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
        }))
      )
    }

    return document
  })
}

// Пример 6: Raw SQL запрос (когда нужна сложная логика)
export async function getDocumentStats() {
  const db = getDb()

  const result = await db.execute(sql`
    SELECT 
      COUNT(*) as total_documents,
      SUM(size) as total_size,
      COUNT(DISTINCT catalog_id) as total_catalogs
    FROM documents
  `)

  // Результат execute возвращает массив строк
  return result[0] as {
    total_documents: string
    total_size: string | null
    total_catalogs: string
  }
}

