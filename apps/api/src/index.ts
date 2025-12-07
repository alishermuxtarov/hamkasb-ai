// Загрузка переменных окружения из корня проекта
// ДОЛЖНО БЫТЬ ПЕРВЫМ, до всех остальных импортов!
import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

// Определяем путь к корню проекта
// При запуске через `bun run src/index.ts` из apps/api, process.cwd() = apps/api
// Нужно подняться на 2 уровня вверх для получения корня проекта
const currentDir = process.cwd()

// Определяем корень проекта
// Вариант 1: Если мы в apps/api, корень на 2 уровня выше
// Вариант 2: Если мы уже в корне (hamkasb-ai), используем текущую директорию
let projectRoot: string
if (currentDir.includes('/apps/api')) {
  // Находимся в apps/api или apps/api/src
  projectRoot = resolve(currentDir, '../../')
} else if (currentDir.endsWith('hamkasb-ai')) {
  // Уже в корне проекта
  projectRoot = currentDir
} else {
  // Fallback: предполагаем что мы в apps/api
  projectRoot = resolve(currentDir, '../../')
}

// Загружаем .env файлы (сначала .env.local, потом .env)
const envLocalPath = resolve(projectRoot, '.env.local')
const envPath = resolve(projectRoot, '.env')

// Загружаем .env.local если существует
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: false })
  console.log(`✅ Loaded .env.local from ${envLocalPath}`)
}

// Загружаем .env (перезаписывает .env.local если есть конфликты)
if (existsSync(envPath)) {
  const result = config({ path: envPath, override: true })
  if (result.error) {
    console.error(`❌ Error loading .env: ${result.error.message}`)
  } else {
    console.log(`✅ Loaded .env from ${envPath}`)
  }
} else {
  console.warn(`⚠️  .env file not found at ${envPath}`)
  console.warn(`   Current directory: ${currentDir}`)
  console.warn(`   Project root: ${projectRoot}`)
}

// Проверяем, что ключевые переменные загружены
if (process.env.BLOB_READ_WRITE_TOKEN) {
  console.log(`   ✓ BLOB_READ_WRITE_TOKEN loaded`)
}
if (process.env.QDRANT_URL) {
  console.log(`   ✓ QDRANT_URL loaded`)
}
if (process.env.OPENAI_API_KEY) {
  console.log(`   ✓ OPENAI_API_KEY loaded`)
}

import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { chatRoutes } from './routes/chat'
import { librarianRoutes } from './routes/librarian'
import { initDocumentsCollection } from './services/qdrant'

// Инициализация Qdrant коллекции при старте (неблокирующая)
initDocumentsCollection()
  .then(() => {
    console.log('✅ Qdrant collection initialized')
  })
  .catch((error) => {
    console.error('❌ Failed to initialize Qdrant collection:', error)
    // Не прерываем запуск приложения, если Qdrant недоступен
  })

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Hamkasb.AI API',
          version: '0.1.0',
          description:
            'API для Hamkasb.AI - AI Коллега для банков и организаций. ' +
            'Предоставляет интерфейсы для работы с AI-агентами, управления документами и чатом.',
          contact: {
            name: 'Hamkasb.AI Team',
          },
        },
        tags: [
          {
            name: 'Health',
            description: 'Проверка работоспособности API',
          },
          {
            name: 'Chat',
            description: 'Чат с AI-агентами',
          },
          {
            name: 'Librarian',
            description: 'Агент "Библиотекарь" - управление документами',
          },
        ],
        servers: [
          {
            url: 'http://localhost:3001',
            description: 'Локальный сервер разработки',
          },
        ],
      },
    })
  )
  .get(
    '/health',
    () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
    {
      detail: {
        tags: ['Health'],
        summary: 'Проверка работоспособности API',
        description: 'Возвращает статус API и текущее время',
        responses: {
          200: {
            description: 'API работает',
            content: {
              'application/json': {
                example: {
                  status: 'ok',
                  timestamp: '2025-12-06T20:00:00.000Z',
                },
              },
            },
          },
        },
      },
    }
  )
  // API routes
  .use(chatRoutes)
  .use(librarianRoutes)

// Для локальной разработки запускаем сервер
// Для Vercel просто экспортируем app без listen()
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(3001)
  console.log(`🦊 Elysia is running at http://localhost:3001`)
}

export default app
