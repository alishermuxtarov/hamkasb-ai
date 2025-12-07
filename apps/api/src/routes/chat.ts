import { Elysia, t } from 'elysia'
import { librarianAgent } from '../agents/librarian/agent'
import { getDb, schema } from '../lib/db'
import { eq, desc, and, sql } from 'drizzle-orm'

const { chatSessions, chatMessages } = schema

/**
 * Создание или получение сессии чата
 * Если sessionId не указан, проверяет последнюю сессию агента.
 * Если последняя сессия старше 30 минут, создает новую.
 * Если forceNew=true, всегда создает новую сессию, игнорируя проверку времени.
 */
async function getOrCreateSession(
  agentId: string,
  sessionId?: string,
  userId?: string,
  forceNew: boolean = false
) {
  const db = getDb()

  if (sessionId) {
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.agentId, agentId)))
      .limit(1)

    if (session) {
      return session
    }
  }

  // Если sessionId не указан и forceNew=false, проверяем последнюю сессию агента
  if (!forceNew) {
    const conditions = [eq(chatSessions.agentId, agentId)]
    if (userId) {
      conditions.push(eq(chatSessions.userId, userId))
    }

    const lastSessions = await db
      .select()
      .from(chatSessions)
      .where(and(...conditions))
      .orderBy(desc(chatSessions.updatedAt))
      .limit(1)

    if (lastSessions.length > 0 && lastSessions[0]) {
      const lastSession = lastSessions[0]
      const now = new Date()
      const lastUpdate = new Date(lastSession.updatedAt)
      const diffMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60)

      // Если последняя сессия обновлялась менее 30 минут назад, используем её
      if (diffMinutes < 30) {
        return lastSession
      }
    }
  }

  // Создаем новую сессию
  const [newSession] = await db
    .insert(chatSessions)
    .values({
      agentId,
      userId: userId || null,
      title: 'New Chat',
    })
    .returning()

  if (!newSession) {
    throw new Error('Failed to create chat session')
  }

  return newSession
}

/**
 * Сохранение сообщения в БД
 */
async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system' | 'tool',
  content: string | null,
  toolCalls?: unknown,
  toolResults?: unknown,
  metadata?: unknown
) {
  const db = getDb()

  const [message] = await db
    .insert(chatMessages)
    .values({
      chatSessionId: sessionId,
      role,
      content,
      toolCalls: toolCalls ? (toolCalls as never) : null,
      toolResults: toolResults ? (toolResults as never) : null,
      metadata: metadata ? (metadata as never) : null,
    })
    .returning()

  return message
}

/**
 * Routes для чата с агентами
 */
export const chatRoutes = new Elysia({ prefix: '/chat' })
  /**
   * POST /chat/:agentId
   * Отправка сообщения агенту и получение ответа
   */
  .post(
    '/:agentId',
    async ({ params, body, set }) => {
      const { agentId } = params
      
      // Поддержка двух форматов: старый (message) и новый (messages array от AI SDK)
      let message: string
      let sessionId: string | undefined
      let userId: string | undefined
      let forceNew: boolean | undefined
      
      const bodyAny = body as any
      
      // Если пришел формат с messages (AI SDK)
      if (bodyAny.messages && Array.isArray(bodyAny.messages)) {
        // Берем последнее сообщение пользователя
        const lastUserMessage = bodyAny.messages
          .filter((m: any) => m.role === 'user')
          .pop()
        
        if (lastUserMessage) {
          // Извлекаем текст из разных форматов
          if (typeof lastUserMessage.content === 'string') {
            message = lastUserMessage.content
          } else if (Array.isArray(lastUserMessage.parts)) {
            // Формат с parts
            const textPart = lastUserMessage.parts.find((p: any) => p.type === 'text')
            message = textPart?.text || ''
          } else if (typeof lastUserMessage.content === 'object' && lastUserMessage.content?.text) {
            message = lastUserMessage.content.text
          } else {
            message = String(lastUserMessage.content || '')
          }
        } else {
          set.status = 400
          return {
            error: 'No user message found in messages array',
          }
        }
        
        // Извлекаем другие параметры
        sessionId = bodyAny.sessionId || bodyAny.id
        userId = bodyAny.userId
        forceNew = bodyAny.forceNew
      } else {
        // Старый формат с message
        message = bodyAny.message
        sessionId = bodyAny.sessionId
        userId = bodyAny.userId
        forceNew = bodyAny.forceNew
      }
      
      if (!message || typeof message !== 'string') {
        set.status = 400
        return {
          error: 'Message is required and must be a string',
        }
      }

      console.log('[Backend /chat/:agentId] Request received:', {
        agentId,
        message: message?.substring(0, 100),
        sessionId,
        userId,
      })
      
      // Определяем, требует ли запрос поиска в документах
      const searchKeywords = [
        'найди', 'ищи', 'есть', 'знаешь', 'в курсе', 'информация', 'документ', 
        'хакатон', 'мероприятие', 'расскажи', 'найди в документах', 'с именем',
        'названием', 'файл', 'task', 'документы'
      ]
      const requiresSearch = searchKeywords.some(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
      )
      
      if (requiresSearch) {
        console.log('[Backend /chat/:agentId] ⚠️ Query REQUIRES document search - agent MUST use searchDocuments tool')
        console.log('[Backend /chat/:agentId] Search keywords detected:', 
          searchKeywords.filter(kw => message.toLowerCase().includes(kw.toLowerCase()))
        )
      }

      // Получаем или создаем сессию
      // Если forceNew === true, всегда создаем новую сессию
      const session = await getOrCreateSession(
        agentId, 
        forceNew ? undefined : sessionId, 
        userId,
        forceNew
      )
      if (!session) {
        set.status = 500
        return {
          error: 'Failed to create or retrieve session',
        }
      }
      console.log('[Backend /chat/:agentId] Session:', {
        id: session.id,
        agentId: session.agentId,
      })

      // Сохраняем сообщение пользователя
      await saveMessage(session.id, 'user', message)

      // Получаем историю сообщений для контекста
      // КРИТИЧЕСКИ ВАЖНО: Исключаем tool и system messages из запроса к БД
      // AI SDK сам управляет tool calls через параметр tools, поэтому tool messages не нужны в истории
      const db = getDb()
      const previousMessages = await db
        .select()
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.chatSessionId, session.id),
            // Исключаем tool и system messages на уровне SQL запроса
            // Используем SQL оператор NOT IN для исключения этих ролей
            sql`${chatMessages.role} NOT IN ('tool', 'system')`
          )
        )
        .orderBy(chatMessages.createdAt) // В хронологическом порядке
        .limit(20) // Последние 20 сообщений

      // Логируем загруженные сообщения для отладки
      console.log('[Chat] Loaded messages from DB:', {
        total: previousMessages.length,
        byRole: previousMessages.reduce((acc, msg) => {
          acc[msg.role] = (acc[msg.role] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        roles: previousMessages.map(m => ({ role: m.role, id: m.id, contentType: typeof m.content, isArray: Array.isArray(m.content) })),
      })
      
      // КРИТИЧЕСКАЯ ПРОВЕРКА: Убеждаемся, что tool messages не попадут в массив
      const toolMessagesInDB = previousMessages.filter(m => {
        const role = String(m.role || '').toLowerCase().trim()
        return role === 'tool'
      })
      if (toolMessagesInDB.length > 0) {
        console.log(`[Chat] ⚠️ Found ${toolMessagesInDB.length} tool messages in DB - they will be skipped`)
        toolMessagesInDB.forEach(tm => {
          console.log(`[Chat] Tool message details:`, {
            id: tm.id,
            role: tm.role,
            contentType: typeof tm.content,
            isArray: Array.isArray(tm.content),
            contentPreview: typeof tm.content === 'string' ? tm.content.substring(0, 100) : 'N/A',
          })
        })
      }

      // Формируем массив сообщений для агента в формате ModelMessage для AI SDK v4
      // AI SDK v4 ожидает ModelMessage[]: ТОЛЬКО user и assistant messages
      // Tool messages НЕ передаются - AI SDK сам управляет tool calls через параметр tools
      const messages: Array<{
        role: 'user' | 'assistant'
        content: string
        toolCalls?: unknown[]
      }> = []

      // Обрабатываем историю сообщений и преобразуем в правильный формат
      // ВАЖНО: При использовании generateText с tools и maxSteps, AI SDK сам управляет tool calls
      // Поэтому мы НЕ передаем tool messages из истории - только user и assistant
      // Tool messages будут автоматически обработаны AI SDK через параметр tools
      const seenMessages = new Set<string>()
      
      for (const msg of previousMessages) {
        // КРИТИЧЕСКИ ВАЖНО: Пропускаем tool messages - они не нужны в истории для generateText с tools
        // AI SDK сам управляет tool calls через параметр tools, поэтому tool messages в истории вызывают ошибку
        // Проверяем role строго (может быть null, undefined, или другой формат)
        const msgRole = String(msg.role || '').toLowerCase().trim()
        
        // СТРОГАЯ ПРОВЕРКА: пропускаем tool и system сообщения
        if (msgRole === 'tool') {
          console.log(`[Chat] ✅ Skipping tool message from history (ID: ${msg.id}, role: "${msg.role}")`)
          continue
        }
        if (msgRole === 'system') {
          console.log(`[Chat] ✅ Skipping system message from history (ID: ${msg.id})`)
          continue
        }
        
        // Дополнительная проверка: если role не user и не assistant, пропускаем
        if (msgRole !== 'user' && msgRole !== 'assistant') {
          console.warn(`[Chat] ⚠️ Skipping message with unknown role: "${msg.role}" (ID: ${msg.id}, normalized: "${msgRole}")`)
          continue
        }
        
        // Создаем ключ для проверки дубликатов (role + content)
        const messageKey = `${msg.role}:${msg.content?.substring(0, 100) || ''}`
        
        // Пропускаем дубликаты
        if (seenMessages.has(messageKey)) {
          console.warn(`[Chat] Skipping duplicate message: ${messageKey}`)
          continue
        }
        seenMessages.add(messageKey)
        
        if (msg.role === 'user') {
          // Убеждаемся, что content - это строка
          let content = msg.content || ''
          if (Array.isArray(content)) {
            content = content
              .filter((part: unknown) => typeof part === 'object' && part !== null && 'text' in part)
              .map((part: { text?: string }) => part.text || '')
              .join('')
          } else if (typeof content !== 'string') {
            content = String(content)
          }
          
          messages.push({
            role: 'user',
            content,
          })
        } else if (msg.role === 'assistant') {
          // Убеждаемся, что content - это строка
          let content = msg.content || ''
          if (Array.isArray(content)) {
            content = content
              .filter((part: unknown) => typeof part === 'object' && part !== null && 'text' in part)
              .map((part: { text?: string }) => part.text || '')
              .join('')
          } else if (typeof content !== 'string') {
            content = String(content)
          }
          
          const assistantMsg: {
            role: 'assistant'
            content: string
            toolCalls?: unknown[]
          } = {
            role: 'assistant',
            content,
          }

          // Добавляем tool calls если есть (но не tool messages - они обрабатываются автоматически)
          if (msg.toolCalls && Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0) {
            assistantMsg.toolCalls = msg.toolCalls as unknown[]
          }
          
          messages.push(assistantMsg)
        }
      }

      // Добавляем текущее сообщение пользователя
      messages.push({
        role: 'user',
        content: message,
      })

      // ФИНАЛЬНАЯ ПРОВЕРКА: Удаляем все tool messages и проверяем формат
      const finalMessages = messages
        .map((msg, index) => {
          // КРИТИЧЕСКАЯ ПРОВЕРКА: tool messages НЕ должны быть в массиве
          if (msg.role === 'tool') {
            console.error(`[Chat] ❌ CRITICAL ERROR: Tool message found at index ${index}! This should never happen!`)
            console.error(`[Chat] Tool message details:`, JSON.stringify(msg, null, 2))
            return null // Помечаем для удаления
          }
          
          // Проверяем, что content - это строка
          if (typeof msg.content !== 'string') {
            console.error(`[Chat] ❌ CRITICAL ERROR: Message at index ${index} has invalid content type!`)
            console.error(`[Chat] Message details:`, { role: msg.role, contentType: typeof msg.content, isArray: Array.isArray(msg.content) })
            // Преобразуем в строку
            if (Array.isArray(msg.content)) {
              const textParts = msg.content
                .filter((part: unknown) => typeof part === 'object' && part !== null && 'text' in part)
                .map((part: { text?: string }) => part.text || '')
              return { ...msg, content: textParts.join('') || '' }
            }
            return { ...msg, content: String(msg.content || '') }
          }
          
          return msg
        })
        .filter((msg): msg is { role: 'user' | 'assistant'; content: string; toolCalls?: unknown[] } => {
          return msg !== null && (msg.role === 'user' || msg.role === 'assistant')
        })

      // Логируем финальный формат сообщений
      console.log('[Chat] Final messages format before agent call:', {
        totalMessages: finalMessages.length,
        messageTypes: finalMessages.map((m, i) => ({ 
          index: i,
          role: m.role, 
          hasContent: !!m.content, 
          contentType: typeof m.content, 
          isArray: Array.isArray(m.content),
          contentPreview: typeof m.content === 'string' ? m.content.substring(0, 50) : 'N/A'
        })),
      })

      // Вызываем агента (пока только librarian)
      let agent
      if (agentId === 'librarian') {
        agent = librarianAgent
      } else {
        set.status = 400
        return {
          error: `Agent ${agentId} not found`,
        }
      }

      try {
        // Генерируем ответ от агента
        // ToolLoopAgent.generate принимает messages или prompt
        // ВАЖНО: передаем только user и assistant сообщения, БЕЗ tool messages
        // Проверяем, что в finalMessages нет tool messages
        const messagesToSend = finalMessages.filter((msg): msg is { role: 'user' | 'assistant'; content: string; toolCalls?: unknown[] } => {
          if (msg.role === 'tool') {
            console.error(`[Chat] ❌ CRITICAL ERROR: Tool message still in finalMessages! This should never happen!`)
            return false
          }
          // Убеждаемся, что content - это строка
          if (typeof msg.content !== 'string') {
            console.error(`[Chat] ❌ CRITICAL ERROR: Message content is not a string! Type: ${typeof msg.content}, IsArray: ${Array.isArray(msg.content)}`)
            return false
          }
          return msg.role === 'user' || msg.role === 'assistant'
        })
        
        console.log('[Chat] Sending to agent:', {
          messagesCount: messagesToSend.length,
          roles: messagesToSend.map(m => m.role),
        })
        
        const result = await agent.generate({
          messages: messagesToSend as never,
        })

        // Собираем все tool calls из всех шагов
        // AI SDK возвращает tool calls в result.steps, а не только в result.toolCalls
        const allToolCalls: unknown[] = []
        const allToolResults: unknown[] = []
        
        if (result.steps && Array.isArray(result.steps)) {
          for (const step of result.steps) {
            // Собираем tool calls из каждого шага
            if ((step as { toolCalls?: unknown[] })?.toolCalls) {
              const stepToolCalls = (step as { toolCalls: unknown[] }).toolCalls
              allToolCalls.push(...stepToolCalls)
            }
            
            // Собираем tool results из каждого шага
            if ((step as { toolResults?: unknown[] })?.toolResults) {
              const stepToolResults = (step as { toolResults: unknown[] }).toolResults
              allToolResults.push(...stepToolResults)
            }
          }
        }
        
        // Также добавляем tool calls из финального результата (если есть)
        if (result.toolCalls && Array.isArray(result.toolCalls)) {
          allToolCalls.push(...result.toolCalls)
        }
        if (result.toolResults && Array.isArray(result.toolResults)) {
          allToolResults.push(...result.toolResults)
        }

        // Защита от выдачи системного промпта
        let responseText = result.text || ''
        const systemPromptKeywords = [
          'Ты - Библиотекарь',
          'AI-агент для управления документами',
          'system prompt',
          'системный промпт',
        ]
        
        // Проверяем, не содержит ли ответ системный промпт
        const containsSystemPrompt = systemPromptKeywords.some(keyword =>
          responseText.toLowerCase().includes(keyword.toLowerCase())
        )
        
        if (containsSystemPrompt) {
          console.warn('⚠️ Detected system prompt in response, filtering...')
          // Удаляем части, похожие на системный промпт
          responseText = responseText
            .replace(/Ты\s*-\s*Библиотекарь[^.]*\./gi, '')
            .replace(/AI-агент\s*для\s*управления\s*документами[^.]*\./gi, '')
            .trim()
          
          // Если после фильтрации текст пустой, используем дефолтный ответ
          if (!responseText) {
            responseText = 'Извините, я не могу обработать этот запрос. Попробуйте переформулировать вопрос.'
          }
        }

        // Сохраняем ответ ассистента
        await saveMessage(
          session.id,
          'assistant',
          responseText,
          allToolCalls.length > 0 ? allToolCalls : null,
          allToolResults.length > 0 ? allToolResults : null,
          {
            finishReason: result.finishReason,
            usage: result.usage,
            stepsCount: result.steps?.length || 0,
          }
        )

        // Сохраняем tool calls и results отдельно, если есть
        if (allToolCalls.length > 0) {
          for (const toolCall of allToolCalls) {
            const toolCallId = (toolCall as { toolCallId?: string })?.toolCallId || 
                              (toolCall as { id?: string })?.id ||
                              `call-${Date.now()}-${Math.random()}`
            
            // Находим соответствующий tool result из всех собранных результатов
            const toolResult = allToolResults.find(
              (r: unknown) => {
                const rObj = r as { toolCallId?: string }
                return rObj.toolCallId === toolCallId
              }
            )
            
            // Формируем content для tool message
            let toolContent: string | null = null
            if (toolResult) {
              const toolResultObj = toolResult as { result?: unknown }
              toolContent = typeof toolResultObj.result === 'string' 
                ? toolResultObj.result 
                : JSON.stringify(toolResultObj.result || toolResult)
            }
            
            await saveMessage(
              session.id,
              'tool',
              toolContent,
              toolCall,
              (toolResult as { result?: unknown })?.result || null,
              { 
                toolName: (toolCall as { toolName?: string })?.toolName,
                toolCallId,
              }
            )
          }
        }

        // Проверяем, были ли вызваны инструменты (из всех шагов)
        const hasToolCalls = allToolCalls.length > 0
        const hasSearchTool = allToolCalls.some((tc: unknown) => 
          (tc as { toolName?: string })?.toolName === 'searchDocuments'
        )
        
        console.log('[Backend /chat/:agentId] Response generated:', {
          sessionId: session.id,
          messageLength: responseText.length,
          hasToolCalls,
          toolCallsCount: allToolCalls.length,
          hasSearchTool,
          stepsCount: result.steps?.length || 0,
          finishReason: result.finishReason,
        })
        
        // КРИТИЧЕСКОЕ предупреждение, если инструменты не были вызваны, но запрос требовал поиска
        if (requiresSearch && !hasSearchTool) {
          console.error('[Backend /chat/:agentId] ❌ CRITICAL ERROR: Query REQUIRED search but searchDocuments tool was NOT called!')
          console.error('[Backend /chat/:agentId] This is a BUG - agent should ALWAYS use searchDocuments for such queries!')
          console.error('[Backend /chat/:agentId] Query:', message)
          console.error('[Backend /chat/:agentId] Response:', responseText.substring(0, 200))
          console.error('[Backend /chat/:agentId] Tool calls found:', allToolCalls.map((tc: unknown) => (tc as { toolName?: string })?.toolName))
        } else if (requiresSearch && hasSearchTool) {
          console.log('[Backend /chat/:agentId] ✅ searchDocuments tool was called correctly')
        }

        return {
          sessionId: session.id,
          message: responseText,
          toolCalls: allToolCalls.length > 0 ? allToolCalls : result.toolCalls,
          toolResults: allToolResults.length > 0 ? allToolResults : result.toolResults,
          steps: result.steps,
          hasToolCalls: allToolCalls.length > 0,
          hasSearchTool,
        }
      } catch (error) {
        console.error('❌ Error in chat route:', error)
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
        set.status = 500
        return {
          error: 'Failed to generate response',
          details: error instanceof Error ? error.message : String(error),
        }
      }
    },
    {
      params: t.Object({
        agentId: t.String(),
      }),
      body: t.Union([
        // Старый формат
        t.Object({
          message: t.String(),
          sessionId: t.Optional(t.String()),
          userId: t.Optional(t.String()),
          forceNew: t.Optional(t.Boolean()),
        }),
        // Новый формат (AI SDK)
        t.Object({
          id: t.Optional(t.String()),
          messages: t.Array(
            t.Object({
              role: t.String(),
              content: t.Union([t.String(), t.Array(t.Any())]),
              parts: t.Optional(t.Array(t.Any())),
            })
          ),
          sessionId: t.Optional(t.String()),
          userId: t.Optional(t.String()),
          forceNew: t.Optional(t.Boolean()),
        }),
      ]),
      detail: {
        tags: ['Chat'],
        summary: 'Отправить сообщение агенту',
        description:
          'Отправляет сообщение указанному AI-агенту и получает ответ. ' +
          'Если sessionId не указан, создается новая сессия чата.',
        examples: [
          {
            description: 'Новое сообщение в новой сессии',
            value: {
              message: 'Найди документы о кредитовании',
            },
          },
          {
            description: 'Продолжение существующей сессии',
            value: {
              message: 'Расскажи подробнее',
              sessionId: 'abc123-def456-ghi789',
            },
          },
        ],
      },
    }
  )

  /**
   * GET /chat/:agentId/sessions
   * Получение списка сессий для агента
   */
  .get(
    '/:agentId/sessions',
    async ({ params, query }) => {
      const { agentId } = params
      const { userId, limit = 20 } = query as {
        userId?: string
        limit?: number
      }

      const db = getDb()
      const conditions = [eq(chatSessions.agentId, agentId)]

      if (userId) {
        conditions.push(eq(chatSessions.userId, userId))
      }

      const sessions = await db
        .select({
          id: chatSessions.id,
          title: chatSessions.title,
          createdAt: chatSessions.createdAt,
          updatedAt: chatSessions.updatedAt,
        })
        .from(chatSessions)
        .where(conditions.length > 1 ? and(...conditions) : conditions[0])
        .orderBy(desc(chatSessions.updatedAt))
        .limit(limit)

      return { sessions }
    },
    {
      params: t.Object({
        agentId: t.String(),
      }),
      query: t.Object({
        userId: t.Optional(t.String()),
        limit: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['Chat'],
        summary: 'Получить список сессий чата',
        description:
          'Возвращает список сессий чата для указанного агента. ' +
          'Можно отфильтровать по userId и ограничить количество результатов.',
      },
    }
  )

  /**
   * GET /chat/:agentId/sessions/:sessionId
   * Получение истории чата для сессии
   */
  .get(
    '/:agentId/sessions/:sessionId',
    async ({ params }) => {
      const { agentId, sessionId } = params

      const db = getDb()

      // Проверяем, что сессия принадлежит агенту
      const [session] = await db
        .select()
        .from(chatSessions)
        .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.agentId, agentId)))
        .limit(1)

      if (!session) {
        return {
          error: 'Session not found',
        }
      }

      // Получаем сообщения
      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.chatSessionId, sessionId))
        .orderBy(chatMessages.createdAt)

      return {
        session: {
          id: session.id,
          agentId: session.agentId,
          title: session.title,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        },
        messages: messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          toolCalls: msg.toolCalls,
          toolResults: msg.toolResults,
          metadata: msg.metadata,
          createdAt: msg.createdAt,
        })),
      }
    },
    {
      params: t.Object({
        agentId: t.String(),
        sessionId: t.String(),
      }),
      detail: {
        tags: ['Chat'],
        summary: 'Получить историю чата',
        description:
          'Возвращает полную историю сообщений для указанной сессии чата.',
      },
    }
  )

  /**
   * DELETE /chat/:agentId/sessions/:sessionId
   * Удаление сессии чата
   */
  .delete(
    '/:agentId/sessions/:sessionId',
    async ({ params }) => {
      const { agentId, sessionId } = params

      const db = getDb()

      // Проверяем, что сессия принадлежит агенту
      const [session] = await db
        .select()
        .from(chatSessions)
        .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.agentId, agentId)))
        .limit(1)

      if (!session) {
        return {
          error: 'Session not found',
        }
      }

      // Удаляем сессию (сообщения удалятся каскадно)
      await db.delete(chatSessions).where(eq(chatSessions.id, sessionId))

      return {
        success: true,
        message: 'Session deleted',
      }
    },
    {
      params: t.Object({
        agentId: t.String(),
        sessionId: t.String(),
      }),
      detail: {
        tags: ['Chat'],
        summary: 'Удалить сессию чата',
        description:
          'Удаляет сессию чата и все связанные сообщения. Операция необратима.',
      },
    }
  )

  /**
   * GET /chat/:agentId/sessions/:sessionId
   * Получение истории чата для сессии
   */
  .get(
    '/:agentId/sessions/:sessionId',
    async ({ params }) => {
      const { agentId, sessionId } = params

      const db = getDb()

      // Проверяем, что сессия принадлежит агенту
      const [session] = await db
        .select()
        .from(chatSessions)
        .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.agentId, agentId)))
        .limit(1)

      if (!session) {
        return {
          error: 'Session not found',
        }
      }

      // Получаем сообщения
      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.chatSessionId, sessionId))
        .orderBy(chatMessages.createdAt)

      return {
        session: {
          id: session.id,
          agentId: session.agentId,
          title: session.title,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        },
        messages: messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          toolCalls: msg.toolCalls,
          toolResults: msg.toolResults,
          metadata: msg.metadata,
          createdAt: msg.createdAt,
        })),
      }
    },
    {
      params: t.Object({
        agentId: t.String(),
        sessionId: t.String(),
      }),
    }
  )

  /**
   * DELETE /chat/:agentId/sessions/:sessionId
   * Удаление сессии чата
   */
  .delete(
    '/:agentId/sessions/:sessionId',
    async ({ params }) => {
      const { agentId, sessionId } = params

      const db = getDb()

      // Проверяем, что сессия принадлежит агенту
      const [session] = await db
        .select()
        .from(chatSessions)
        .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.agentId, agentId)))
        .limit(1)

      if (!session) {
        return {
          error: 'Session not found',
        }
      }

      // Удаляем сессию (сообщения удалятся каскадно)
      await db.delete(chatSessions).where(eq(chatSessions.id, sessionId))

      return {
        success: true,
        message: 'Session deleted',
      }
    },
    {
      params: t.Object({
        agentId: t.String(),
        sessionId: t.String(),
      }),
    }
  )

