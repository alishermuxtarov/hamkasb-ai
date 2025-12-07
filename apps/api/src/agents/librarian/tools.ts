import { tool } from 'ai'
import { z } from 'zod'
import { getDb, schema } from '../../lib/db'
import {
  getDocumentById,
  searchDocumentsByQuery,
  processDocument,
} from '../../services/documents'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

const { documentCatalogs } = schema

/**
 * Инструменты агента "Библиотекарь"
 */
export const librarianTools = {
  /**
   * Поиск документов по векторной БД
   */
  searchDocuments: tool({
    description:
      'КРИТИЧЕСКИ ВАЖНЫЙ И ОБЯЗАТЕЛЬНЫЙ инструмент для поиска документов в библиотеке. ' +
      'ИСПОЛЬЗУЙ ЭТОТ ИНСТРУМЕНТ ДЛЯ КАЖДОГО ЗАПРОСА, КОТОРЫЙ МОЖЕТ СОДЕРЖАТЬ ИНФОРМАЦИЮ В ДОКУМЕНТАХ!\n\n' +
      'ОБЯЗАТЕЛЬНО вызывай этот инструмент, когда:\n' +
      '- Пользователь задает ЛЮБОЙ вопрос о документах, информации, событиях\n' +
      '- Пользователь ищет документы по теме, ключевым словам, содержанию ИЛИ ИМЕНИ ФАЙЛА\n' +
      '- Пользователь спрашивает "найди", "есть ли", "в курсе", "знаешь о", "расскажи о"\n' +
      '- Пользователь упоминает названия файлов, события, мероприятия, процедуры\n' +
      '- Пользователь задает вопросы "что", "где", "когда", "как" относительно документов\n' +
      '- Пользователь просит найти документ по имени (например: "найди документ Task2")\n\n' +
      'Инструмент использует ГИБРИДНЫЙ поиск:\n' +
      '1. Векторный поиск по содержимому документов (семантический поиск в Qdrant)\n' +
      '2. Поиск по имени файла (частичное совпадение в PostgreSQL)\n\n' +
      'Параметр query должен содержать:\n' +
      '- Для поиска по содержимому: ключевые слова, темы, вопросы\n' +
      '- Для поиска по имени файла: название файла или его часть (например: "Task2", "[Task2]")\n\n' +
      'КРИТИЧЕСКИ ВАЖНО: Инструмент возвращает результаты с полем "preview", которое содержит РЕЛЕВАНТНЫЙ ТЕКСТ из найденных документов.\n' +
      'Для высокорелевантных документов (score > 0.4) это ВЕСЬ документ, для остальных - релевантный фрагмент.\n\n' +
      'ТЫ ОБЯЗАН:\n' +
      '1. ВНИМАТЕЛЬНО ПРОЧИТАТЬ содержимое каждого preview (это может быть весь документ!)\n' +
      '2. ИЗВЛЕЧЬ конкретную информацию из preview, которая отвечает на вопрос пользователя\n' +
      '3. СФОРМИРОВАТЬ ПОЛНЫЙ ответ НА ОСНОВЕ этой информации, а не просто перечислить документы\n' +
      '4. ЦИТИРОВАТЬ конкретные факты из preview в своем ответе\n' +
      '5. Если preview содержит полный документ - используй ВСЮ информацию из него для ответа\n\n' +
      'НЕ ДЕЛАЙ:\n' +
      '- НЕ просто перечисляй названия документов\n' +
      '- НЕ говори "документ может содержать" - ЧИТАЙ preview и отвечай на основе него!\n' +
      '- НЕ упоминай документы, если их preview не содержит релевантной информации\n' +
      '- НЕ останавливайся на поверхностной информации - если есть полный документ, используй ВСЮ информацию\n\n' +
      'ВСЕГДА используй этот инструмент ПЕРЕД ответом на вопросы о содержимом документов. ' +
      'НИКОГДА не отвечай "документы не найдены" без вызова этого инструмента!',
    parameters: z.object({
      query: z
        .string()
        .describe('Поисковый запрос на естественном языке'),
      catalogId: z
        .string()
        .optional()
        .describe('ID каталога для фильтрации результатов'),
      limit: z
        .number()
        .default(5)
        .describe('Количество результатов (по умолчанию 5)'),
    }),
    execute: async ({ query, catalogId, limit }) => {
      try {
        console.log(`[Tool: searchDocuments] Starting search with query: "${query}"`)
        
        // Выполняем RAG процесс:
        // 1. Извлечение поискового запроса (LLM) - внутри searchDocumentsByQuery
        // 2. Векторизация запроса (OpenAI embeddings) - внутри searchDocumentsByQuery
        // 3. Поиск в Qdrant - внутри searchDocumentsByQuery
        // 4. Результаты возвращаются здесь и автоматически включаются в контекст агента
        const results = await searchDocumentsByQuery(query, {
          catalogId,
          limit,
        })

        if (results.length === 0) {
          console.log(`[Tool: searchDocuments] No documents found for query: "${query}"`)
          return {
            success: true,
            message: 'Документы не найдены',
            results: [],
            searchQuery: query, // Возвращаем использованный запрос для отладки
          }
        }

        console.log(`[Tool: searchDocuments] Found ${results.length} documents`)
        
        // Сортируем результаты по релевантности (score) перед форматированием
        const sortedResults = [...results].sort((a, b) => b.score - a.score)
        
        // Определяем порог релевантности для фильтрации нерелевантных документов
        const maxScore = sortedResults.length > 0 && sortedResults[0] ? sortedResults[0].score : 0
        const relevanceThreshold = maxScore > 0.4 ? maxScore - 0.05 : 0.35
        
        // Фильтруем нерелевантные документы
        const relevantResults = sortedResults.filter(r => r.score >= relevanceThreshold)
        console.log(`[Tool: searchDocuments] Filtered to ${relevantResults.length} relevant results (threshold: ${relevanceThreshold.toFixed(3)})`)
        
        // Формируем результаты для включения в контекст LLM
        // ВАЖНО: Для релевантных документов используем ВЕСЬ контент, а не только preview
        const formattedResults = relevantResults.map((r, index) => {
          // Для высокорелевантных документов (score > 0.4 или первый результат) используем весь контент
          const isHighlyRelevant = r.score > 0.4 || (index === 0 && r.score > 0.35)
          const content = isHighlyRelevant && r.document.contentText
            ? r.document.contentText // ВЕСЬ документ для релевантных результатов
            : r.chunk?.content || r.document.contentText?.substring(0, 2000) || '' // Preview для остальных

        return {
            documentId: r.document.id,
            filename: r.document.originalFilename,
            score: r.score,
            relevance: index === 0 && r.score > 0.4 ? 'high' : r.score > 0.35 ? 'medium' : 'low',
            // content содержит релевантный текст из документа - ЭТО ГЛАВНОЕ ДЛЯ ОТВЕТА!
            // Для релевантных документов это ВЕСЬ документ, для остальных - preview
            // Агент ДОЛЖЕН использовать этот текст для формирования ответа!
            preview: content,
            // Флаг, указывающий, что это полный контент документа
            isFullContent: isHighlyRelevant && !!r.document.contentText,
            // Дополнительная информация для контекста
            catalog: r.document.catalog
              ? {
                  id: r.document.catalog.id,
                  name: r.document.catalog.name,
                }
              : null,
          }
        })
        
        console.log(`[Tool: searchDocuments] Returning ${formattedResults.length} results`)
        // Логируем результаты для отладки
        formattedResults.forEach((r, i) => {
          console.log(`[Tool: searchDocuments] Result ${i + 1}: ${r.filename} (score: ${r.score.toFixed(3)}, relevance: ${r.relevance}, content: ${r.preview?.length || 0} chars, full: ${r.isFullContent})`)
        })

        return {
          success: true,
          message: `Найдено ${results.length} документ(ов)`,
          results: formattedResults,
          // Дополнительная информация для контекста
          searchQuery: query,
          totalResults: results.length,
        }
      } catch (error) {
        console.error('❌ Error in searchDocuments tool:', error)
        console.error('❌ Error stack:', error instanceof Error ? error.stack : undefined)
        return {
          success: false,
          message: `Ошибка поиска: ${error instanceof Error ? error.message : String(error)}`,
          results: [],
          searchQuery: query,
        }
      }
    },
  }),

  /**
   * Получение документа по ID
   */
  getDocument: tool({
    description:
      'Получить полную информацию о документе по его ID. Используй этот инструмент, когда:\n' +
      '- Пользователь запрашивает детальную информацию о конкретном документе\n' +
      '- Нужно получить полный текст документа после поиска\n' +
      '- Пользователь хочет увидеть содержимое документа целиком\n\n' +
      'Этот инструмент возвращает полный текст документа, метаданные и информацию о каталоге.',
    parameters: z.object({
      documentId: z.string().describe('ID документа'),
    }),
    execute: async ({ documentId }) => {
      try {
        const document = await getDocumentById(documentId)

        if (!document) {
          return {
            success: false,
            message: 'Документ не найден',
            document: null,
          }
        }

        return {
          success: true,
          message: 'Документ найден',
          document: {
            id: document.id,
            filename: document.originalFilename,
            mimeType: document.mimeType,
            size: document.size,
            blobUrl: document.blobUrl,
            contentText: document.contentText?.substring(0, 1000), // Первые 1000 символов
            catalog: document.catalog
              ? {
                  id: document.catalog.id,
                  name: document.catalog.name,
                }
              : null,
            chunksCount: document.chunks?.length || 0,
            createdAt: document.createdAt.toISOString(),
          },
        }
      } catch (error) {
        console.error('❌ Error in getDocument tool:', error)
        return {
          success: false,
          message: `Ошибка получения документа: ${error}`,
          document: null,
        }
      }
    },
  }),

  /**
   * Создание каталога
   */
  createCatalog: tool({
    description:
      'Создать новый каталог (папку) для организации документов в библиотеке. Используй этот инструмент, когда:\n' +
      '- Пользователь просит создать новую папку или категорию\n' +
      '- Пользователь хочет организовать документы по темам\n' +
      '- Нужно создать структуру для группировки документов\n\n' +
      'Каталоги могут быть вложенными (parentId) для создания иерархической структуры.',
    parameters: z.object({
      name: z.string().describe('Название каталога'),
      description: z
        .string()
        .optional()
        .describe('Описание каталога'),
      parentId: z
        .string()
        .optional()
        .describe('ID родительского каталога (для вложенных каталогов)'),
    }),
    execute: async ({ name, description, parentId }) => {
      try {
        const db = getDb()

        const [catalog] = await db
          .insert(documentCatalogs)
          .values({
            name,
            description: description || null,
            parentId: parentId || null,
          })
          .returning()

        if (!catalog) {
          return {
            success: false,
            message: 'Не удалось создать каталог',
            catalog: null,
          }
        }

        return {
          success: true,
          message: 'Каталог успешно создан',
          catalog: {
            id: catalog.id,
            name: catalog.name,
            description: catalog.description,
            parentId: catalog.parentId,
            createdAt: catalog.createdAt.toISOString(),
          },
        }
      } catch (error) {
        console.error('❌ Error in createCatalog tool:', error)
        return {
          success: false,
          message: `Ошибка создания каталога: ${error}`,
          catalog: null,
        }
      }
    },
  }),

  /**
   * Загрузка документа
   * Примечание: В реальном использовании этот инструмент будет вызываться через API endpoint,
   * а не напрямую через tool. Но для полноты функционала оставляем его здесь.
   */
  uploadDocument: tool({
    description:
      'Загрузить новый документ в библиотеку. Этот инструмент используется для обработки уже загруженных файлов.',
    parameters: z.object({
      filename: z.string().describe('Имя файла'),
      content: z
        .string()
        .describe('Base64 encoded file content'),
      catalogId: z
        .string()
        .optional()
        .describe('ID каталога для размещения документа'),
      clientId: z
        .string()
        .optional()
        .describe('ID клиента (если документ привязан к клиенту)'),
    }),
    execute: async ({ filename, content, catalogId, clientId }) => {
      try {
        // Декодирование Base64
        const buffer = Buffer.from(content, 'base64')

        // Определение MIME типа по расширению
        let mimeType = 'application/octet-stream'
        if (filename.endsWith('.pdf')) {
          mimeType = 'application/pdf'
        } else if (
          filename.endsWith('.docx') ||
          filename.endsWith('.doc')
        ) {
          mimeType =
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        } else if (filename.endsWith('.txt')) {
          mimeType = 'text/plain'
        } else if (filename.endsWith('.md') || filename.endsWith('.markdown')) {
          mimeType = 'text/markdown'
        }

        // Обработка документа
        const { id, document } = await processDocument(
          {
            name: filename,
            buffer,
            type: mimeType,
          },
          {
            catalogId,
            clientId,
          }
        )

        return {
          success: true,
          message: 'Документ успешно загружен и обработан',
          documentId: id,
          filename: document.originalFilename,
        }
      } catch (error) {
        console.error('❌ Error in uploadDocument tool:', error)
        return {
          success: false,
          message: `Ошибка загрузки документа: ${error}`,
          documentId: null,
        }
      }
    },
  }),

  /**
   * Резюме документа
   */
  summarizeDocument: tool({
    description:
      'Создать структурированное резюме документа с основными тезисами. Используй этот инструмент, когда:\n' +
      '- Пользователь просит кратко описать документ\n' +
      '- Нужно выделить ключевые моменты документа\n' +
      '- Пользователь хочет получить основные тезисы без чтения всего документа\n\n' +
      'Резюме создается с помощью AI и включает: основную тему, ключевые моменты, важные детали и выводы.',
    parameters: z.object({
      documentId: z.string().describe('ID документа'),
      language: z
        .enum(['ru', 'uz', 'en', 'kaa'])
        .optional()
        .describe('Язык для резюме (по умолчанию - язык пользователя)'),
    }),
    execute: async ({ documentId, language = 'ru' }) => {
      try {
        const document = await getDocumentById(documentId)

        if (!document || !document.contentText) {
          return {
            success: false,
            message: 'Документ не найден или не содержит текста',
            summary: null,
          }
        }

        // Генерация резюме с помощью LLM
        const languageNames: Record<string, string> = {
          ru: 'русском',
          uz: 'узбекском',
          en: 'английском',
          kaa: 'каракалпакском',
        }

        const { text: summary } = await generateText({
          model: openai('gpt-4-turbo'),
          prompt: `Создай краткое резюме следующего документа на ${languageNames[language]} языке. Резюме должно быть структурированным и содержать основные тезисы.

Документ: ${document.originalFilename}

Содержимое:
${document.contentText.substring(0, 8000)} // Ограничиваем размер для контекста

Резюме должно быть на ${languageNames[language]} языке и содержать:
1. Основную тему документа
2. Ключевые моменты (3-5 пунктов)
3. Важные детали или цифры (если есть)
4. Выводы или рекомендации (если есть)`,
        })

        return {
          success: true,
          message: 'Резюме успешно создано',
          summary,
          language,
        }
      } catch (error) {
        console.error('❌ Error in summarizeDocument tool:', error)
        return {
          success: false,
          message: `Ошибка создания резюме: ${error}`,
          summary: null,
        }
      }
    },
  }),

  /**
   * Перевод документа
   */
  translateDocument: tool({
    description:
      'Перевести документ на другой язык с сохранением структуры и форматирования. Используй этот инструмент, когда:\n' +
      '- Пользователь просит перевести документ\n' +
      '- Нужно предоставить документ на другом языке (ru, uz, en, kaa)\n' +
      '- Пользователь работает с многоязычной аудиторией\n\n' +
      'Перевод выполняется с помощью AI с сохранением технических терминов и структуры документа.',
    parameters: z.object({
      documentId: z.string().describe('ID документа'),
      targetLanguage: z
        .enum(['ru', 'uz', 'en', 'kaa'])
        .describe('Целевой язык для перевода'),
    }),
    execute: async ({ documentId, targetLanguage }) => {
      try {
        const document = await getDocumentById(documentId)

        if (!document || !document.contentText) {
          return {
            success: false,
            message: 'Документ не найден или не содержит текста',
            translation: null,
          }
        }

        // Перевод с помощью LLM
        const languageNames: Record<string, string> = {
          ru: 'русский',
          uz: 'узбекский',
          en: 'английский',
          kaa: 'каракалпакский',
        }

        const { text: translation } = await generateText({
          model: openai('gpt-4-turbo'),
          prompt: `Переведи следующий документ на ${languageNames[targetLanguage]} язык. Сохрани структуру и форматирование документа.

Документ: ${document.originalFilename}

Содержимое:
${document.contentText.substring(0, 8000)} // Ограничиваем размер для контекста

Перевод должен быть точным и сохранять все технические термины и названия.`,
        })

        return {
          success: true,
          message: `Документ переведен на ${languageNames[targetLanguage]} язык`,
          translation,
          targetLanguage,
        }
      } catch (error) {
        console.error('❌ Error in translateDocument tool:', error)
        return {
          success: false,
          message: `Ошибка перевода: ${error}`,
          translation: null,
        }
      }
    },
  }),

  /**
   * Извлечение данных в таблицу
   */
  extractToTable: tool({
    description:
      'Извлечь структурированные данные из документа в формате JSON/таблицы. Используй этот инструмент, когда:\n' +
      '- Пользователь просит извлечь данные в структурированном виде\n' +
      '- Нужно получить конкретные поля из документа (даты, суммы, названия и т.д.)\n' +
      '- Пользователь хочет экспортировать данные в таблицу\n\n' +
      'Инструмент использует AI для извлечения данных по заданным полям с указанными типами (text, date, number, boolean).',
    parameters: z.object({
      documentId: z.string().describe('ID документа'),
      fields: z
        .array(
          z.object({
            name: z.string().describe('Название поля'),
            description: z
              .string()
              .describe('Описание того, что нужно извлечь'),
            type: z
              .enum(['text', 'date', 'number', 'boolean'])
              .describe('Тип данных'),
          })
        )
        .describe('Список полей для извлечения'),
    }),
    execute: async ({ documentId, fields }) => {
      try {
        const document = await getDocumentById(documentId)

        if (!document || !document.contentText) {
          return {
            success: false,
            message: 'Документ не найден или не содержит текста',
            data: null,
          }
        }

        // Извлечение данных с помощью LLM
        const fieldsDescription = fields
          .map(
            (f) =>
              `- ${f.name} (${f.type}): ${f.description}`
          )
          .join('\n')

        const { text: extractedData } = await generateText({
          model: openai('gpt-4-turbo'),
          prompt: `Извлеки структурированные данные из следующего документа в формате JSON.

Документ: ${document.originalFilename}

Содержимое:
${document.contentText.substring(0, 8000)}

Поля для извлечения:
${fieldsDescription}

Верни результат в формате JSON с ключами, соответствующими названиям полей. Если какое-то поле не найдено, используй null.`,
        })

        // Парсинг JSON из ответа
        let data: Record<string, unknown>
        try {
          // Извлекаем JSON из текста (может быть обернут в markdown code block)
          const jsonMatch = extractedData.match(/```json\n([\s\S]*?)\n```/) ||
            extractedData.match(/\{[\s\S]*\}/)
          const jsonString = jsonMatch
            ? jsonMatch[1] || jsonMatch[0]
            : extractedData
          data = JSON.parse(jsonString)
        } catch {
          // Если не удалось распарсить, возвращаем как текст
          data = { raw: extractedData }
        }

        return {
          success: true,
          message: 'Данные успешно извлечены',
          data,
          fields: fields.map((f) => f.name),
        }
      } catch (error) {
        console.error('❌ Error in extractToTable tool:', error)
        return {
          success: false,
          message: `Ошибка извлечения данных: ${error}`,
          data: null,
        }
      }
    },
  }),
}

