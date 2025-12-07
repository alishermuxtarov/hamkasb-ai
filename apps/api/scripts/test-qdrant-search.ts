/**
 * Скрипт для тестирования поиска в Qdrant
 * Проверяет подключение, наличие данных и работу поиска
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

// Загрузка переменных окружения
// Определяем корень проекта (scripts/ -> apps/api/ -> корень)
const currentDir = process.cwd()
let projectRoot: string

if (currentDir.includes('/apps/api')) {
  // Мы в apps/api или apps/api/scripts
  projectRoot = resolve(currentDir, '../../')
} else if (currentDir.endsWith('hamkasb-ai')) {
  // Уже в корне проекта
  projectRoot = currentDir
} else {
  // Fallback
  projectRoot = resolve(currentDir, '../../')
}

const envLocalPath = resolve(projectRoot, '.env.local')
const envPath = resolve(projectRoot, '.env')

console.log(`📁 Project root: ${projectRoot}`)
console.log(`📁 Looking for .env at: ${envPath}`)

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: false })
  console.log(`✅ Loaded .env.local`)
}
if (existsSync(envPath)) {
  config({ path: envPath, override: true })
  console.log(`✅ Loaded .env`)
} else {
  console.warn(`⚠️  .env file not found at ${envPath}`)
}

import { QdrantClient } from '@qdrant/js-client-rest'
import { generateEmbedding } from '../src/services/embeddings'
import { getDb, schema } from '../src/lib/db'
import { eq } from 'drizzle-orm'

const { documents, documentChunks } = schema

const DOCUMENTS_COLLECTION = 'documents'

async function testQdrantSearch() {
  console.log('🔍 Тестирование поиска в Qdrant\n')

  // 1. Проверка подключения к Qdrant
  const qdrantUrl = process.env.QDRANT_URL
  const qdrantApiKey = process.env.QDRANT_API_KEY

  if (!qdrantUrl) {
    console.error('❌ QDRANT_URL не установлен в переменных окружения')
    process.exit(1)
  }

  console.log(`✅ QDRANT_URL: ${qdrantUrl}`)
  console.log(`✅ QDRANT_API_KEY: ${qdrantApiKey ? 'установлен' : 'не установлен'}\n`)

  const qdrantClient = new QdrantClient({
    url: qdrantUrl,
    apiKey: qdrantApiKey,
  })

  // 2. Проверка существования коллекции
  console.log('📋 Проверка коллекции...')
  try {
    const collections = await qdrantClient.getCollections()
    const collectionExists = collections.collections.some(
      (col) => col.name === DOCUMENTS_COLLECTION
    )

    if (!collectionExists) {
      console.error(`❌ Коллекция "${DOCUMENTS_COLLECTION}" не найдена`)
      console.log('Доступные коллекции:', collections.collections.map((c) => c.name))
      process.exit(1)
    }

    console.log(`✅ Коллекция "${DOCUMENTS_COLLECTION}" существует\n`)

    // Получаем информацию о коллекции
    const collectionInfo = await qdrantClient.getCollection(DOCUMENTS_COLLECTION)
    console.log('📊 Информация о коллекции:')
    console.log(`   - Точек (vectors): ${collectionInfo.points_count}`)
    console.log(`   - Размерность векторов: ${collectionInfo.config.params.vectors.size}`)
    console.log(`   - Метрика расстояния: ${collectionInfo.config.params.vectors.distance}\n`)

    if (collectionInfo.points_count === 0) {
      console.warn('⚠️  Коллекция пуста! Нужно загрузить документы.\n')
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке коллекции:', error)
    process.exit(1)
  }

  // 3. Получение примеров данных из коллекции
  console.log('📥 Получение примеров данных из коллекции...')
  try {
    const scrollResult = await qdrantClient.scroll(DOCUMENTS_COLLECTION, {
      limit: 5,
      with_payload: true,
      with_vector: false,
    })

    console.log(`✅ Получено ${scrollResult.points.length} примеров точек\n`)

    if (scrollResult.points.length > 0) {
      console.log('📄 Примеры данных:')
      scrollResult.points.slice(0, 3).forEach((point, index) => {
        console.log(`\n   Пример ${index + 1}:`)
        console.log(`   - ID: ${point.id}`)
        console.log(`   - Payload:`, JSON.stringify(point.payload, null, 2))
      })
      console.log('')
    } else {
      console.warn('⚠️  Нет данных в коллекции для тестирования\n')
    }
  } catch (error) {
    console.error('❌ Ошибка при получении данных:', error)
    process.exit(1)
  }

  // 4. Проверка данных в PostgreSQL
  console.log('🗄️  Проверка данных в PostgreSQL...')
  try {
    const db = getDb()
    const chunks = await db
      .select()
      .from(documentChunks)
      .limit(5)

    console.log(`✅ Найдено ${chunks.length} chunks в PostgreSQL\n`)

    if (chunks.length > 0) {
      console.log('📄 Примеры chunks из PostgreSQL:')
      chunks.slice(0, 2).forEach((chunk, index) => {
        console.log(`\n   Chunk ${index + 1}:`)
        console.log(`   - ID: ${chunk.id}`)
        console.log(`   - Document ID: ${chunk.documentId}`)
        console.log(`   - Content preview: ${chunk.content.substring(0, 100)}...`)
      })
      console.log('')
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке PostgreSQL:', error)
  }

  // 5. Тестирование векторизации
  console.log('🧮 Тестирование векторизации...')
  try {
    const testQuery = 'хакатон'
    console.log(`   Тестовый запрос: "${testQuery}"`)
    
    const embedding = await generateEmbedding(testQuery)
    console.log(`✅ Embedding создан: ${embedding.length} dimensions`)
    console.log(`   Первые 5 значений: [${embedding.slice(0, 5).join(', ')}...]\n`)
  } catch (error) {
    console.error('❌ Ошибка при векторизации:', error)
    process.exit(1)
  }

  // 6. Тестирование поиска
  console.log('🔎 Тестирование поиска в Qdrant...')
  try {
    const testQueries = [
      'хакатон',
      'Task 2',
      'AI500',
      'кредитование',
    ]

    for (const query of testQueries) {
      console.log(`\n   Запрос: "${query}"`)
      
      // Генерируем embedding
      const queryEmbedding = await generateEmbedding(query)
      
      // Выполняем поиск с разными порогами
      const thresholds = [0.3, 0.5, 0.7]
      
      for (const threshold of thresholds) {
        try {
          const results = await qdrantClient.search(DOCUMENTS_COLLECTION, {
            vector: queryEmbedding,
            limit: 5,
            score_threshold: threshold,
          })

          console.log(`     Порог ${threshold}: найдено ${results.length} результатов`)
          
          if (results.length > 0) {
            console.log(`     Топ результат:`)
            const top = results[0]
            console.log(`       - Score: ${top.score}`)
            console.log(`       - ID: ${top.id}`)
            console.log(`       - Document ID: ${top.payload?.documentId}`)
            console.log(`       - Filename: ${top.payload?.filename}`)
            console.log(`       - Content preview: ${(top.payload?.content as string)?.substring(0, 80)}...`)
          }
        } catch (searchError) {
          console.error(`     ❌ Ошибка поиска с порогом ${threshold}:`, searchError)
        }
      }
    }
  } catch (error) {
    console.error('❌ Ошибка при тестировании поиска:', error)
    if (error instanceof Error) {
      console.error('   Stack:', error.stack)
    }
  }

  // 7. Проверка фильтров
  console.log('\n🔍 Тестирование поиска с фильтрами...')
  try {
    const testQuery = 'документ'
    const queryEmbedding = await generateEmbedding(testQuery)
    
    // Пробуем разные форматы фильтров
    const filterFormats = [
      undefined, // Без фильтра
      { key: 'payload.catalogId', match: { value: null } }, // Фильтр по catalogId
    ]

    for (const filter of filterFormats) {
      try {
        const results = await qdrantClient.search(DOCUMENTS_COLLECTION, {
          vector: queryEmbedding,
          limit: 3,
          filter: filter as any,
          score_threshold: 0.3,
        })

        console.log(`   Фильтр ${filter ? JSON.stringify(filter) : 'нет'}: ${results.length} результатов`)
      } catch (filterError) {
        console.error(`   ❌ Ошибка с фильтром ${JSON.stringify(filter)}:`, filterError)
      }
    }
  } catch (error) {
    console.error('❌ Ошибка при тестировании фильтров:', error)
  }

  console.log('\n✅ Тестирование завершено')
}

// Запуск теста
testQdrantSearch()
  .then(() => {
    console.log('\n✅ Все тесты завершены')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Критическая ошибка:', error)
    if (error instanceof Error) {
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  })

