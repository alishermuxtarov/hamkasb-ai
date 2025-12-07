import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Singleton для клиента БД
let queryClient: postgres.Sql | null = null
let dbInstance: ReturnType<typeof drizzle> | null = null

/**
 * Получение Drizzle клиента
 * Использует connection pooling для оптимальной производительности
 */
export function getDb() {
  if (dbInstance) {
    return dbInstance
  }

  // Для Vercel используем POSTGRES_URL_NON_POOLING (без connection pooling)
  // Для локальной разработки используем DATABASE_URL
  const connectionString =
    process.env.VERCEL
      ? process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL
      : process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL or POSTGRES_URL_NON_POOLING environment variable is required'
    )
  }

  // Настройки подключения
  const maxConnections = process.env.VERCEL ? 1 : 20

  queryClient = postgres(connectionString, {
    max: maxConnections,
    idle_timeout: 20,
    connect_timeout: 10,
  })

  dbInstance = drizzle(queryClient, {
    schema,
    logger: process.env.NODE_ENV === 'development',
  })

  return dbInstance
}

/**
 * Закрытие подключения (для graceful shutdown)
 */
export async function closeDb() {
  if (queryClient) {
    await queryClient.end()
    queryClient = null
    dbInstance = null
  }
}

// Экспорт схемы для использования в запросах
export { schema }
