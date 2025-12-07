import type { Config } from 'drizzle-kit'
import { config } from 'dotenv'
import { resolve } from 'path'

// Получаем путь к корню проекта
// drizzle.config.ts находится в apps/api/, поэтому корень проекта на 2 уровня выше
const projectRoot = resolve(__dirname || process.cwd(), '../../')

// Загружаем .env файлы из корня проекта (сначала .env.local, потом .env)
// Это позволяет Drizzle Kit читать DATABASE_URL из .env файла
const envLocalPath = resolve(projectRoot, '.env.local')
const envPath = resolve(projectRoot, '.env')

config({ path: envLocalPath })
config({ path: envPath })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL не найден в переменных окружения')
  console.error(`   Проверьте файлы: ${envLocalPath} или ${envPath}`)
  throw new Error(
    'DATABASE_URL environment variable is required. Please set it in .env.local or .env file in the project root'
  )
}

export default {
  schema: './src/lib/db/schema/index.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
} satisfies Config
