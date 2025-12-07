import { openai } from '@ai-sdk/openai'
import { embed } from 'ai'

/**
 * Генерация embedding для текста
 * Использует OpenAI text-embedding-3-small (1536 размерность)
 * 
 * Это критически важная функция для RAG (Retrieval-Augmented Generation):
 * - Векторизует поисковые запросы для семантического поиска
 * - Векторизует chunks документов при индексации
 * - Обеспечивает семантическое понимание запросов
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Получаем ключ из переменных окружения при каждом вызове
  // Это гарантирует, что переменная будет доступна даже если .env загружен после импорта модуля
  const openaiApiKey = process.env.OPENAI_API_KEY

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty for embedding generation')
  }

  try {
    // Нормализуем текст перед векторизацией
    const normalizedText = text.trim()
    
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'), // 1536 dimensions
      value: normalizedText,
    })

    if (!embedding || embedding.length !== 1536) {
      throw new Error(`Invalid embedding dimensions: expected 1536, got ${embedding?.length || 0}`)
    }

    return embedding
  } catch (error) {
    console.error('❌ Error generating embedding:', error)
    console.error('❌ Text that failed:', text.substring(0, 100))
    throw error
  }
}

/**
 * Генерация embeddings для массива текстов (batch)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // Получаем ключ из переменных окружения при каждом вызове
  const openaiApiKey = process.env.OPENAI_API_KEY

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }

  try {
    // OpenAI API поддерживает batch embeddings
    const embeddings = await Promise.all(
      texts.map((text) => generateEmbedding(text))
    )

    return embeddings
  } catch (error) {
    console.error('❌ Error generating embeddings:', error)
    throw error
  }
}

