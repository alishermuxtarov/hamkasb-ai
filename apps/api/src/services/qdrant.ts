import { QdrantClient } from '@qdrant/js-client-rest'

// Ленивая инициализация клиента (чтобы .env успел загрузиться)
let qdrantClientInstance: QdrantClient | null = null

function getQdrantClient(): QdrantClient {
  if (!qdrantClientInstance) {
    const qdrantUrl = process.env.QDRANT_URL
    const qdrantApiKey = process.env.QDRANT_API_KEY

    if (!qdrantUrl) {
      throw new Error('QDRANT_URL environment variable is required')
    }

    qdrantClientInstance = new QdrantClient({
      url: qdrantUrl,
      apiKey: qdrantApiKey,
    })
  }

  return qdrantClientInstance
}

// Proxy для ленивой инициализации клиента
export const qdrantClient = new Proxy({} as QdrantClient, {
  get(_target, prop) {
    const client = getQdrantClient()
    const value = client[prop as keyof QdrantClient]
    // Если это функция, привязываем контекст
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

// Коллекция для документов
export const DOCUMENTS_COLLECTION = 'documents'

/**
 * Инициализация коллекции документов в Qdrant
 */
export async function initDocumentsCollection() {
  try {
    // Проверяем, существует ли коллекция
    const collections = await qdrantClient.getCollections()
    const exists = collections.collections.some(
      (col) => col.name === DOCUMENTS_COLLECTION
    )

    if (!exists) {
      // Создаем коллекцию с векторами размерности 1536 (OpenAI text-embedding-3-small)
      await qdrantClient.createCollection(DOCUMENTS_COLLECTION, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      })
      console.log(`✅ Created Qdrant collection: ${DOCUMENTS_COLLECTION}`)
    } else {
      console.log(`✅ Qdrant collection already exists: ${DOCUMENTS_COLLECTION}`)
    }
  } catch (error) {
    console.error('❌ Error initializing Qdrant collection:', error)
    throw error
  }
}

/**
 * Поиск документов по вектору в Qdrant
 * 
 * Это ключевая функция для RAG:
 * - Принимает векторизованный запрос (1536 dimensions от OpenAI)
 * - Ищет наиболее релевантные chunks в векторной БД
 * - Возвращает результаты с метаданными для включения в контекст LLM
 * 
 * @param vector - Вектор запроса (1536 dimensions от OpenAI text-embedding-3-small)
 * @param options - Опции поиска (limit, filter, scoreThreshold)
 * @returns Массив результатов с score, payload (documentId, content, chunkIndex и т.д.)
 */
export async function searchDocuments(
  vector: number[],
  options: {
    limit?: number
    filter?: Record<string, unknown>
    scoreThreshold?: number
  } = {}
) {
  // ВАЖНО: scoreThreshold по умолчанию 0.3, так как cosine similarity дает низкие scores
  // Тестирование показало, что релевантные результаты имеют score 0.3-0.45
  const { limit = 5, filter, scoreThreshold = 0.3 } = options

  // Валидация вектора
  if (!vector || vector.length !== 1536) {
    throw new Error(`Invalid vector dimensions: expected 1536, got ${vector?.length || 0}`)
  }

  try {
    // Формируем фильтр для Qdrant
    // Qdrant использует структуру фильтров с условиями must/should/must_not
    // Правильный формат: { must: [{ key: "payload.field", match: { value: "value" } }] }
    let qdrantFilter: unknown = undefined
    
    if (filter && Object.keys(filter).length > 0) {
      // Фильтруем только валидные значения (не null, не undefined, не пустые строки)
      const conditions = Object.entries(filter)
        .filter(([_, value]) => {
          // Исключаем null, undefined, пустые строки
          if (value === null || value === undefined) return false
          if (typeof value === 'string' && value.trim().length === 0) return false
          return true
        })
        .map(([key, value]) => ({
          key: `payload.${key}`,
          match: { value },
        }))
      
      if (conditions.length > 0) {
        qdrantFilter = conditions.length === 1 
          ? conditions[0]
          : { must: conditions }
      }
    }
    
    const results = await qdrantClient.search(DOCUMENTS_COLLECTION, {
      vector,
      limit,
      filter: qdrantFilter as any, // Qdrant client типизация
      score_threshold: scoreThreshold,
    })

    console.log(`[Qdrant] Search completed: ${results.length} results (threshold: ${scoreThreshold})`)
    
    // Логируем топ-3 результата для отладки
    if (results.length > 0) {
      console.log(`[Qdrant] Top results:`, results.slice(0, 3).map(r => ({
        score: r.score,
        documentId: r.payload?.documentId,
        filename: r.payload?.filename,
      })))
    }

    return results
  } catch (error) {
    console.error('❌ Error searching documents in Qdrant:', error)
    console.error('❌ Search params:', { limit, filter, scoreThreshold, vectorLength: vector.length })
    throw error
  }
}

/**
 * Добавление вектора документа в Qdrant
 */
export async function upsertDocument(
  id: string,
  vector: number[],
  payload: Record<string, unknown>
) {
  try {
    await qdrantClient.upsert(DOCUMENTS_COLLECTION, {
      wait: true,
      points: [
        {
          id,
          vector,
          payload,
        },
      ],
    })
  } catch (error) {
    console.error('❌ Error upserting document to Qdrant:', error)
    throw error
  }
}

/**
 * Удаление документа из Qdrant
 */
export async function deleteDocument(id: string) {
  try {
    await qdrantClient.delete(DOCUMENTS_COLLECTION, {
      wait: true,
      points: [id],
    })
  } catch (error) {
    console.error('❌ Error deleting document from Qdrant:', error)
    throw error
  }
}

/**
 * Удаление всех чанков из коллекции documents в Qdrant
 */
export async function deleteAllDocuments() {
  try {
    // Используем scroll для получения всех точек, затем удаляем их
    // Qdrant не имеет прямого метода для удаления всех точек, поэтому используем scroll + delete
    const allPoints: string[] = []
    let offset: string | number | undefined = undefined
    let hasMore = true

    console.log('[Qdrant] Starting to collect all point IDs...')
    
    while (hasMore) {
      const scrollResult = await qdrantClient.scroll(DOCUMENTS_COLLECTION, {
        limit: 100,
        offset,
        with_payload: false,
        with_vector: false,
      })

      if (scrollResult.points && scrollResult.points.length > 0) {
        const pointIds = scrollResult.points.map((point) => {
          // Qdrant может возвращать ID как число или строку
          return typeof point.id === 'string' ? point.id : String(point.id)
        })
        allPoints.push(...pointIds)
        offset = scrollResult.next_page_offset as string | number | undefined
        hasMore = offset !== null && offset !== undefined
        console.log(`[Qdrant] Collected ${allPoints.length} point IDs so far...`)
      } else {
        hasMore = false
      }
    }

    console.log(`[Qdrant] Total points to delete: ${allPoints.length}`)

    if (allPoints.length === 0) {
      console.log('[Qdrant] No points to delete')
      return { deleted: 0 }
    }

    // Удаляем все точки батчами по 100 (лимит Qdrant)
    const batchSize = 100
    let deleted = 0

    for (let i = 0; i < allPoints.length; i += batchSize) {
      const batch = allPoints.slice(i, i + batchSize)
      await qdrantClient.delete(DOCUMENTS_COLLECTION, {
        wait: true,
        points: batch,
      })
      deleted += batch.length
      console.log(`[Qdrant] Deleted ${deleted}/${allPoints.length} points...`)
    }

    console.log(`✅ Successfully deleted ${deleted} points from Qdrant collection: ${DOCUMENTS_COLLECTION}`)
    return { deleted }
  } catch (error) {
    console.error('❌ Error deleting all documents from Qdrant:', error)
    throw error
  }
}

