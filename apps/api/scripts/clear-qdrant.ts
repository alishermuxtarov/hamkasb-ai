/**
 * Скрипт для удаления всех чанков из коллекции documents в Qdrant
 * 
 * ВНИМАНИЕ: Это деструктивная операция! Все векторы будут удалены из Qdrant.
 * 
 * Использование:
 *   bun run scripts/clear-qdrant.ts
 */

// Загрузка переменных окружения
import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Определяем корень проекта
const currentDir = process.cwd()
let projectRoot: string

if (currentDir.includes('/apps/api')) {
  projectRoot = resolve(currentDir, '../../')
} else if (currentDir.endsWith('hamkasb-ai')) {
  projectRoot = currentDir
} else {
  projectRoot = resolve(currentDir, '../../')
}

const envLocalPath = resolve(projectRoot, '.env.local')
const envPath = resolve(projectRoot, '.env')

config({ path: envLocalPath })
config({ path: envPath })

import { deleteAllDocuments } from '../src/services/qdrant'

async function clearQdrant() {
  console.log('🗑️  Удаление всех чанков из коллекции documents в Qdrant...\n')

  try {
    const result = await deleteAllDocuments()
    console.log(`\n✅ Успешно удалено ${result.deleted} чанков из Qdrant`)
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Ошибка при удалении чанков:', error)
    process.exit(1)
  }
}

clearQdrant()

