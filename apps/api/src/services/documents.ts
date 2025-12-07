import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import { getDb, schema } from '../lib/db'
import { uploadFile } from './blob'
import { generateEmbedding } from './embeddings'
import { upsertDocument as upsertDocumentToQdrant } from './qdrant'
import type { Document } from '../lib/db/types'
import { eq, inArray, asc, or, and, sql } from 'drizzle-orm'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const { documents, documentChunks, documentCatalogs } = schema

/**
 * Константы для разбиения текста на chunks
 */
const CHUNK_SIZE = 1000 // Целевой размер chunk в символах
const CHUNK_MIN_SIZE = 200 // Минимальный размер chunk
const CHUNK_MAX_SIZE = 1500 // Максимальный размер chunk
const CHUNK_OVERLAP = 200 // Перекрытие между chunks (в предложениях)

/**
 * Разбиение текста на предложения
 * Учитывает различные типы окончаний предложений, абзацы и исключения
 */
function splitIntoSentences(text: string): string[] {
  // Сохраняем абзацы (двойной перенос строки) как отдельные предложения
  // Сначала разбиваем по абзацам
  const paragraphs = text.split(/\n\s*\n+/).filter(p => p.trim().length > 0)
  
  const allSentences: string[] = []
  
  for (const paragraph of paragraphs) {
    // Нормализуем пробелы внутри абзаца
    const normalized = paragraph.replace(/\s+/g, ' ').trim()
    
    // Регулярное выражение для поиска конца предложения
    // Учитывает: . ! ? и следующие за ними пробелы/переносы строк
    // Исключаем:
    // - Точки в числах (1.5, 3.14)
    // - Аббревиатуры (т.е., и т.д., etc., др., г., ст., п., и др.)
    // - Инициалы (А.С. Пушкин)
    const sentenceEndRegex = /([.!?])\s+(?=[А-ЯЁA-Z]|\n|$)/g
    
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = sentenceEndRegex.exec(normalized)) !== null) {
      const potentialEnd = match.index + 1
      const beforeEnd = normalized.slice(Math.max(0, potentialEnd - 10), potentialEnd)
      
      // Проверяем, не является ли это частью аббревиатуры или числа
      const isAbbreviation = /[а-яёa-z]\.\s*$/.test(beforeEnd) // Маленькая буква перед точкой
      const isNumber = /\d\.\d/.test(normalized.slice(Math.max(0, potentialEnd - 5), potentialEnd + 5))
      const isInitial = /[А-ЯЁA-Z]\.\s*[А-ЯЁA-Z]/.test(normalized.slice(Math.max(0, potentialEnd - 5), potentialEnd + 5))
      
      if (!isAbbreviation && !isNumber && !isInitial) {
        const sentence = normalized.slice(lastIndex, potentialEnd).trim()
        if (sentence.length > 0) {
          allSentences.push(sentence)
        }
        lastIndex = match.index + match[0].length
      }
    }

    // Добавляем остаток абзаца
    const remainder = normalized.slice(lastIndex).trim()
    if (remainder.length > 0) {
      allSentences.push(remainder)
    }
  }

  return allSentences.filter(s => s.length > 0)
}

/**
 * Умное разбиение текста на chunks по предложениям
 * Группирует предложения в чанки, сохраняя семантическую целостность
 */
export function splitTextIntoChunks(text: string): string[] {
  // Сначала разбиваем на предложения
  const sentences = splitIntoSentences(text)
  
  if (sentences.length === 0) {
    return []
  }

  const chunks: string[] = []
  let currentChunk: string[] = []
  let currentSize = 0

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i]
    if (!sentence) continue
    
    const sentenceSize = sentence.length + 1 // +1 для пробела между предложениями

    // Если добавление предложения превысит максимум, завершаем текущий chunk
    if (currentSize + sentenceSize > CHUNK_MAX_SIZE && currentChunk.length > 0) {
      // Сохраняем текущий chunk
      const chunk = currentChunk.join(' ').trim()
      if (chunk.length >= CHUNK_MIN_SIZE) {
        chunks.push(chunk)
      }

      // Начинаем новый chunk с перекрытием (последние N предложений предыдущего chunk)
      const overlapSentences = Math.max(1, Math.floor(CHUNK_OVERLAP / 100))
      currentChunk = currentChunk.slice(-overlapSentences).filter((s): s is string => !!s)
      currentSize = currentChunk.join(' ').length
    }

    // Добавляем предложение к текущему chunk
    currentChunk.push(sentence)
    currentSize += sentenceSize

    // Если chunk достиг целевого размера, завершаем его
    if (currentSize >= CHUNK_SIZE && currentChunk.length > 0) {
      const chunk = currentChunk.join(' ').trim()
      if (chunk.length >= CHUNK_MIN_SIZE) {
        chunks.push(chunk)
        // Начинаем новый chunk с перекрытием
        const overlapSentences = Math.max(1, Math.floor(CHUNK_OVERLAP / 100))
        currentChunk = currentChunk.slice(-overlapSentences).filter((s): s is string => !!s)
        currentSize = currentChunk.join(' ').length
      }
    }
  }

  // Добавляем последний chunk, если он есть
  if (currentChunk.length > 0) {
    const chunk = currentChunk.join(' ').trim()
    if (chunk.length >= CHUNK_MIN_SIZE) {
      chunks.push(chunk)
    } else if (chunks.length > 0) {
      // Если последний chunk слишком маленький, добавляем его к предыдущему
      chunks[chunks.length - 1] += ' ' + chunk
    }
  }

  return chunks.filter(chunk => chunk.length > 0)
}

/**
 * Извлечение текста из PDF
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<{
  text: string
  metadata: Record<string, unknown>
}> {
  try {
    const data = await pdfParse(buffer)
    return {
      text: data.text,
      metadata: {
        pages: data.numpages,
        info: data.info,
        metadata: data.metadata,
      },
    }
  } catch (error) {
    console.error('❌ Error extracting text from PDF:', error)
    throw new Error(`Failed to extract text from PDF: ${error}`)
  }
}

/**
 * Извлечение текста из DOCX
 */
export async function extractTextFromDOCX(buffer: Buffer): Promise<{
  text: string
  html: string
  metadata: Record<string, unknown>
}> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    const htmlResult = await mammoth.convertToHtml({ buffer })

    return {
      text: result.value,
      html: htmlResult.value,
      metadata: {
        messages: result.messages,
        warnings: htmlResult.messages,
      },
    }
  } catch (error) {
    console.error('❌ Error extracting text from DOCX:', error)
    throw new Error(`Failed to extract text from DOCX: ${error}`)
  }
}

/**
 * Генерация summary документа на указанном языке
 */
async function generateSummary(
  contentText: string,
  language: 'ru' | 'en' | 'uz' | 'kaa',
  filename: string
): Promise<string> {
  const languageNames: Record<string, string> = {
    ru: 'русском',
    en: 'английском',
    uz: 'узбекском',
    kaa: 'каракалпакском',
  }

  try {
    // Ограничиваем размер контента для генерации summary (первые 10000 символов)
    const contentForSummary = contentText.substring(0, 10000)
    
    const { text } = await generateText({
      model: openai('gpt-4-turbo'),
      prompt: `Создай краткое содержание (summary) следующего документа на ${languageNames[language]} языке в формате Markdown.

Файл: ${filename}

Требования к summary:
- Длина: 3-5 абзацев
- Формат: Markdown с заголовками, списками и форматированием
- Содержание: основные темы, ключевые моменты, важные детали
- Язык: строго на ${languageNames[language]} языке
- Структура: используй заголовки (##), списки (-), выделение (**bold**)

Содержимое документа:
${contentForSummary}

Краткое содержание (Markdown):`,
      maxTokens: 1000,
      temperature: 0.3,
    })

    return text.trim()
  } catch (error) {
    console.error(`❌ Error generating summary in ${language}:`, error)
    return `*Краткое содержание недоступно на ${languageNames[language]} языке*`
  }
}

/**
 * Конвертация содержимого документа в Markdown на указанном языке
 */
async function convertToMarkdown(
  contentText: string,
  language: 'ru' | 'en' | 'uz' | 'kaa',
  filename: string
): Promise<string> {
  const languageNames: Record<string, string> = {
    ru: 'русском',
    en: 'английском',
    uz: 'узбекском',
    kaa: 'каракалпакском',
  }

  try {
    // Ограничиваем размер контента для конвертации (первые 15000 символов)
    const contentForConversion = contentText.substring(0, 15000)
    
    const { text } = await generateText({
      model: openai('gpt-4-turbo'),
      prompt: `Конвертируй следующий текст документа в формат Markdown на ${languageNames[language]} языке.

Файл: ${filename}

Требования:
- Сохрани всю структуру и содержание документа
- Используй Markdown форматирование: заголовки (#, ##, ###), списки (-, *), выделение (**bold**, *italic*)
- Сохрани нумерацию, таблицы (если возможно), абзацы
- Язык: строго на ${languageNames[language]} языке (если исходный текст на другом языке - переведи)
- Если текст уже на ${languageNames[language]} - просто конвертируй в Markdown без перевода

Исходный текст:
${contentForConversion}

Markdown версия:`,
      maxTokens: 4000,
      temperature: 0.2,
    })

    return text.trim()
  } catch (error) {
    console.error(`❌ Error converting to markdown in ${language}:`, error)
    // Возвращаем исходный текст как fallback
    return `\`\`\`\n${contentText.substring(0, 1000)}\n\`\`\``
  }
}

/**
 * Генерация summary и markdown на всех 4 языках
 */
async function generateMultilingualContent(
  contentText: string,
  filename: string
): Promise<{
  summary: Record<'ru' | 'en' | 'uz' | 'kaa', string>
  contentMarkdown: Record<'ru' | 'en' | 'uz' | 'kaa', string>
}> {
  const languages: Array<'ru' | 'en' | 'uz' | 'kaa'> = ['ru', 'en', 'uz', 'kaa']

  // Генерируем summary и markdown параллельно для всех языков
  const summaryPromises = languages.map((lang) =>
    generateSummary(contentText, lang, filename)
  )
  const markdownPromises = languages.map((lang) =>
    convertToMarkdown(contentText, lang, filename)
  )

  const [summaries, markdowns] = await Promise.all([
    Promise.all(summaryPromises),
    Promise.all(markdownPromises),
  ])

  return {
    summary: {
      ru: summaries[0] || '',
      en: summaries[1] || '',
      uz: summaries[2] || '',
      kaa: summaries[3] || '',
    },
    contentMarkdown: {
      ru: markdowns[0] || '',
      en: markdowns[1] || '',
      uz: markdowns[2] || '',
      kaa: markdowns[3] || '',
    },
  }
}

/**
 * Обработка и сохранение документа
 */
export async function processDocument(
  file: File | { name: string; buffer: Buffer; type: string },
  options?: {
    catalogId?: string
    clientId?: string
    uploadedBy?: string
  }
): Promise<{ id: string; document: Document }> {
  const db = getDb()
  const buffer = file instanceof File
    ? Buffer.from(await file.arrayBuffer())
    : file.buffer
  const filename = file instanceof File ? file.name : file.name
  const rawMimeType = file instanceof File ? (file.type ?? '') : (file.type ?? '')
  
  // Определяем MIME тип по расширению файла, если не указан
  let mimeType: string = rawMimeType || 'application/octet-stream'
  if (!rawMimeType || rawMimeType === 'application/octet-stream') {
    if (filename.endsWith('.txt')) {
      mimeType = 'text/plain'
    } else if (filename.endsWith('.md') || filename.endsWith('.markdown')) {
      mimeType = 'text/markdown'
    } else if (filename.endsWith('.pdf')) {
      mimeType = 'application/pdf'
    } else if (filename.endsWith('.docx') || filename.endsWith('.doc')) {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
  }
  
  // Нормализуем MIME тип (убираем параметры типа charset)
  const normalizedMimeType = mimeType.split(';')[0].trim()

  // Извлечение текста в зависимости от типа файла
  let contentText = ''
  let contentHtml: string | null = null
  let metadata: Record<string, unknown> = {}

  if (normalizedMimeType === 'application/pdf' || filename.endsWith('.pdf')) {
    const extracted = await extractTextFromPDF(buffer)
    contentText = extracted.text
    metadata = extracted.metadata
  } else if (
    normalizedMimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    filename.endsWith('.docx') ||
    filename.endsWith('.doc')
  ) {
    const extracted = await extractTextFromDOCX(buffer)
    if (extracted) {
      contentText = extracted.text
      contentHtml = extracted.html
      metadata = extracted.metadata
    } else {
      throw new Error('Failed to extract text from DOCX')
    }
  } else if (normalizedMimeType === 'text/plain' || filename.endsWith('.txt')) {
    // Обработка TXT файлов
    contentText = buffer.toString('utf-8')
    contentHtml = null
    metadata = {
      encoding: 'utf-8',
      lineCount: contentText.split('\n').length,
    }
  } else if (normalizedMimeType === 'text/markdown' || filename.endsWith('.md') || filename.endsWith('.markdown')) {
    // Обработка Markdown файлов
    const markdownText = buffer.toString('utf-8')
    contentText = markdownText
    // Для markdown можно сохранить как HTML, но пока сохраняем как текст
    // В будущем можно использовать библиотеку для конвертации markdown в HTML
    contentHtml = null
    metadata = {
      encoding: 'utf-8',
      lineCount: markdownText.split('\n').length,
      format: 'markdown',
    }
  } else {
    throw new Error(`Unsupported file type: ${mimeType} (normalized: ${normalizedMimeType}, filename: ${filename})`)
  }

  // Загрузка файла в Blob Storage
  const timestamp = Date.now()
  const blobFilename = `${timestamp}-${filename}`
  const finalMimeType = normalizedMimeType || mimeType
  const { url: blobUrl } = await uploadFile(blobFilename, buffer, {
    contentType: finalMimeType,
  })

  // Генерация summary и markdown на всех 4 языках
  console.log(`[Document Processing] Generating multilingual content for ${filename}...`)
  let multilingualContent: {
    summary: Record<'ru' | 'en' | 'uz' | 'kaa', string>
    contentMarkdown: Record<'ru' | 'en' | 'uz' | 'kaa', string>
  } | null = null

  try {
    multilingualContent = await generateMultilingualContent(contentText, filename)
    console.log(`[Document Processing] ✅ Multilingual content generated for ${filename}`)
  } catch (error) {
    console.error(`[Document Processing] ❌ Error generating multilingual content:`, error)
    // Продолжаем без multilingual content, если генерация не удалась
    multilingualContent = {
      summary: { ru: '', en: '', uz: '', kaa: '' },
      contentMarkdown: { ru: '', en: '', uz: '', kaa: '' },
    }
  }

  // Сохранение документа в БД
  const [document] = await db
    .insert(documents)
    .values({
      filename: blobFilename,
      originalFilename: filename,
      mimeType: finalMimeType,
      size: buffer.length,
      blobUrl,
      contentText,
      contentHtml,
      contentMarkdown: multilingualContent.contentMarkdown,
      summary: multilingualContent.summary,
      metadata,
      catalogId: options?.catalogId,
      clientId: options?.clientId,
      uploadedBy: options?.uploadedBy,
    })
    .returning()

  if (!document) {
    throw new Error('Failed to create document in database')
  }

  // Разбиение текста на chunks
  const chunks = splitTextIntoChunks(contentText)

  // Сохранение chunks в БД и Qdrant
  const chunkPromises = chunks.map(async (chunk, index) => {
    // Генерация embedding для chunk
    const embedding = await generateEmbedding(chunk)

    // Сохранение chunk в БД
    const startChar = contentText.indexOf(chunk)
    const endChar = startChar + chunk.length

    const [dbChunk] = await db
      .insert(documentChunks)
      .values({
        documentId: document.id,
        chunkIndex: index,
        content: chunk,
        startChar,
        endChar,
        metadata: {
          chunkSize: chunk.length,
        },
      })
      .returning()

    // Сохранение в Qdrant с ID = chunk.id
    if (dbChunk) {
      await upsertDocumentToQdrant(dbChunk.id, embedding, {
        documentId: document.id,
        chunkIndex: index,
        filename: document.originalFilename,
        catalogId: document.catalogId || undefined,
        clientId: document.clientId || undefined,
          // Увеличиваем размер content для лучшего контекста (до 2000 символов)
          // Это даст агенту больше информации для ответа
          content: chunk.substring(0, 2000), // Увеличено с 500 до 2000 для лучшего контекста
      })
    }
  })

  await Promise.all(chunkPromises)

  console.log(
    `✅ Document processed: ${document.id} (${chunks.length} chunks)`
  )

  return { id: document.id, document }
}

/**
 * Получение документа по ID
 */
export async function getDocumentById(documentId: string) {
  const db = getDb()
  
  // Получаем документ
  const [document] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1)

  if (!document) {
    return null
  }

  // Получаем каталог, если есть
  let catalog = null
  if (document.catalogId) {
    const [catalogResult] = await db
      .select()
      .from(documentCatalogs)
      .where(eq(documentCatalogs.id, document.catalogId))
      .limit(1)
    catalog = catalogResult || null
  }

  // Получаем chunks
  const chunks = await db
    .select()
    .from(documentChunks)
    .where(eq(documentChunks.documentId, documentId))
    .orderBy(asc(documentChunks.chunkIndex))

  return {
    ...document,
    catalog,
    chunks,
  }
}

/**
 * Извлечение поискового запроса из пользовательского вопроса с помощью LLM
 * Оптимизирует запрос для векторного поиска
 */
async function extractSearchQuery(userQuery: string): Promise<string> {
  try {
    const { generateText } = await import('ai')
    const { openai } = await import('@ai-sdk/openai')
    
    const { text: extractedQuery } = await generateText({
      model: openai('gpt-4-turbo'),
      prompt: `Ты - эксперт по извлечению поисковых запросов для векторного поиска документов.

Задача: Извлеки из пользовательского запроса оптимальную поисковую строку для семантического поиска в базе документов.

Правила:
1. Убери служебные слова и фразы ("найди", "расскажи", "есть ли", "в курсе" и т.д.)
2. Оставь ключевые слова, темы, суть вопроса
3. Если упоминается имя файла - сохрани его
4. Сохрани контекст и смысл запроса
5. Верни ТОЛЬКО поисковую строку, без дополнительных комментариев

Примеры:
- "Расскажи о хакатоне" → "хакатон"
- "Найди документ Task 2" → "Task 2"
- "А ты не в курсе ни о каком хакатоне?" → "хакатон"
- "Есть ли информация о кредитовании?" → "кредитование"
- "Что такое AI500?" → "AI500"

Пользовательский запрос: "${userQuery}"

Поисковая строка:`,
      maxTokens: 50,
      temperature: 0.3,
    })
    
    const cleanQuery = extractedQuery.trim().replace(/^["']|["']$/g, '')
    console.log(`[Search] Extracted search query: "${userQuery}" → "${cleanQuery}"`)
    
    return cleanQuery || userQuery // Fallback на оригинальный запрос
  } catch (error) {
    console.error('❌ Error extracting search query with LLM:', error)
    // Fallback: простая очистка запроса
    return userQuery
      .replace(/^(найди|ищи|есть ли|в курсе|знаешь о|расскажи о|что такое|где|когда|как)\s+/i, '')
      .trim()
  }
}

/**
 * Поиск документов по текстовому запросу
 * Поддерживает гибридный поиск: векторный поиск + поиск по имени файла
 * 
 * Процесс RAG:
 * 1. Извлечение поискового запроса из пользовательского вопроса (LLM)
 * 2. Векторизация запроса (OpenAI embeddings)
 * 3. Поиск в Qdrant (векторная БД)
 * 4. Возврат результатов для включения в контекст
 */
export async function searchDocumentsByQuery(
  query: string,
  options?: {
    catalogId?: string
    limit?: number
    extractQuery?: boolean // Опция для отключения извлечения запроса (для тестов)
  }
) {
  const db = getDb()
  const limit = options?.limit || 5
  
  // ШАГ 1: Извлечение поискового запроса с помощью LLM
  // Это оптимизирует запрос для лучшего векторного поиска
  const searchQuery = options?.extractQuery !== false 
    ? await extractSearchQuery(query)
    : query
  
  console.log(`[Search] Original query: "${query}"`)
  console.log(`[Search] Optimized query: "${searchQuery}"`)
  
  // ГИБРИДНЫЙ ПОИСК: векторный + поиск по имени файла
  
  // 1. Поиск по имени файла в PostgreSQL (частичное совпадение)
  const filenameSearchResults: Array<{
    document: typeof documents.$inferSelect
    score: number
    matchType: 'filename'
  }> = []
  
  // Извлекаем возможные имена файлов из оптимизированного запроса (убираем служебные слова)
  const queryWords = searchQuery
    .toLowerCase()
    .replace(/[[\]]/g, '') // Убираем квадратные скобки
    .split(/\s+/)
    .filter(word => word.length > 2 && !['найди', 'документ', 'документы', 'с', 'именем', 'названием'].includes(word))
  
  if (queryWords.length > 0) {
    // Ищем документы, где имя файла содержит любое из ключевых слов
    // Используем ilike для case-insensitive поиска
    const filenameConditions = queryWords.map(word => 
      sql`LOWER(${documents.originalFilename}) LIKE LOWER(${'%' + word + '%'})`
    )
    
    const filenameFilter = options?.catalogId
      ? and(
          or(...filenameConditions),
          eq(documents.catalogId, options.catalogId)
        )
      : or(...filenameConditions)
    
    const filenameDocs = await db
      .select()
      .from(documents)
      .where(filenameFilter)
      .limit(limit * 2) // Берем больше, чтобы потом отсортировать по релевантности
    
    // Вычисляем релевантность по количеству совпадений
    for (const doc of filenameDocs) {
      const filenameLower = doc.originalFilename.toLowerCase()
      let matchScore = 0
      for (const word of queryWords) {
        if (filenameLower.includes(word)) {
          matchScore += 1
          // Бонус за точное совпадение
          if (filenameLower === word || filenameLower.includes(` ${word} `)) {
            matchScore += 0.5
          }
        }
      }
      
      if (matchScore > 0) {
        filenameSearchResults.push({
          document: doc,
          score: matchScore / queryWords.length, // Нормализуем до 0-1
          matchType: 'filename',
        })
      }
    }
    
    // Сортируем по релевантности
    filenameSearchResults.sort((a, b) => b.score - a.score)
  }

  // ШАГ 2: Векторизация поискового запроса с помощью OpenAI embedding модели
  // Используем оптимизированный запрос для лучшей релевантности
  console.log(`[Search] Generating embedding for query: "${searchQuery}"`)
  const queryEmbedding = await generateEmbedding(searchQuery)
  console.log(`[Search] Embedding generated: ${queryEmbedding.length} dimensions`)
  
  // ШАГ 3: Поиск в Qdrant (векторная БД)

  // Построение фильтра для Qdrant
  const filter: Record<string, unknown> = {}
  if (options?.catalogId) {
    filter.catalogId = options.catalogId
  }

  // Поиск в Qdrant с векторизованным запросом
  // ВАЖНО: scoreThreshold должен быть низким (0.3), так как cosine similarity
  // дает низкие scores даже для релевантных результатов
  // Тестирование показало: релевантные результаты имеют score 0.3-0.45
  // Но мы берем больше результатов и потом фильтруем по релевантности
  const { searchDocuments } = await import('./qdrant')
  const vectorResults = await searchDocuments(queryEmbedding, {
    limit: limit * 3, // Берем больше для лучшей выборки
    filter: Object.keys(filter).length > 0 ? filter : undefined,
    scoreThreshold: 0.3, // Начальный порог
  })
  
  // Дополнительная фильтрация по релевантности
  // Используем более умную логику: если есть явно лучший результат, фильтруем остальные
  if (vectorResults.length === 0) {
    return []
  }
  
  const scores = vectorResults.map(r => r.score || 0)
  const maxScore = Math.max(...scores)
  const sortedScores = [...scores].sort((a, b) => b - a)
  
  // Если есть явно лучший результат (разница > 0.05), фильтруем более агрессивно
  const scoreGap = sortedScores.length > 1 && sortedScores[0] !== undefined && sortedScores[1] !== undefined
    ? sortedScores[0] - sortedScores[1]
    : 0
  const hasClearWinner = scoreGap > 0.05 && maxScore > 0.35
  
  let filteredVectorResults = vectorResults
  
  if (hasClearWinner) {
    // Если есть явно лучший результат, оставляем только результаты близкие к нему (в пределах 0.05)
    const threshold = maxScore - 0.05
    filteredVectorResults = vectorResults.filter(r => (r.score || 0) >= threshold)
    console.log(`[Search] Clear winner detected (score gap: ${scoreGap.toFixed(3)}), filtering to threshold: ${threshold.toFixed(3)}`)
  } else if (maxScore > 0.4) {
    // Если есть высокорелевантные результаты, фильтруем низкорелевантные
    filteredVectorResults = vectorResults.filter(r => (r.score || 0) >= 0.35)
    console.log(`[Search] High relevance results found, filtering to threshold: 0.35`)
  } else if (maxScore > 0.35) {
    // Если лучший результат имеет среднюю релевантность, фильтруем более строго (в пределах 0.03)
    const threshold = maxScore - 0.03
    filteredVectorResults = vectorResults.filter(r => (r.score || 0) >= threshold)
    console.log(`[Search] Medium relevance results, filtering to threshold: ${threshold.toFixed(3)}`)
  } else {
    // Иначе оставляем все, но ограничиваем количеством
    filteredVectorResults = vectorResults.slice(0, limit * 2)
    console.log(`[Search] No clear winner, keeping top ${filteredVectorResults.length} results`)
  }
  
  console.log(`[Search] Qdrant search completed: ${vectorResults.length} results found`)
  console.log(`[Search] After relevance filtering: ${filteredVectorResults.length} results`)
  if (filteredVectorResults.length > 0) {
    const filteredScores = filteredVectorResults.map(r => r.score || 0).filter(s => s > 0)
    if (filteredScores.length > 0) {
      console.log(`[Search] Score range: ${Math.min(...filteredScores).toFixed(3)} - ${Math.max(...filteredScores).toFixed(3)}`)
    }
  }
  
  // ШАГ 4: Результаты будут включены в контекст через tool results
  // AI SDK автоматически добавит их в контекст следующего шага агента

  // 3. Объединение результатов векторного поиска и поиска по имени
  const vectorDocumentIds = [
    ...new Set(
      filteredVectorResults.map((r) => r.payload?.documentId as string).filter(Boolean)
    ),
  ]
  
  const filenameDocumentIds = filenameSearchResults.map(r => r.document.id)
  
  // Объединяем ID документов из обоих источников
  const allDocumentIds = [...new Set([...vectorDocumentIds, ...filenameDocumentIds])]

  if (allDocumentIds.length === 0) {
    return []
  }

  // Получаем документы
  const foundDocuments = await db
    .select()
    .from(documents)
    .where(inArray(documents.id, allDocumentIds))

  // Получаем каталоги для документов
  const catalogIds = foundDocuments
    .map((d) => d.catalogId)
    .filter((id): id is string => id !== null)
  const catalogsMap = new Map<string, typeof documentCatalogs.$inferSelect>()
  
  if (catalogIds.length > 0) {
    const catalogs = await db
      .select()
      .from(documentCatalogs)
      .where(inArray(documentCatalogs.id, catalogIds))
    
    for (const catalog of catalogs) {
      catalogsMap.set(catalog.id, catalog)
    }
  }

  // Добавляем каталоги к документам
  const documentsWithCatalogs = foundDocuments.map((doc) => ({
    ...doc,
    catalog: doc.catalogId ? catalogsMap.get(doc.catalogId) || null : null,
  }))

  // 4. Создаем объединенные результаты с приоритетом
  const resultsMap = new Map<string, {
    document: typeof documentsWithCatalogs[0]
    score: number
    chunk?: {
      id: string
      content: string
      chunkIndex: number
    }
    matchType: 'vector' | 'filename' | 'both'
  }>()
  
  // Добавляем результаты векторного поиска (используем отфильтрованные результаты)
  for (const result of filteredVectorResults) {
    const documentId = result.payload?.documentId as string
    if (!documentId) continue
    
    const document = documentsWithCatalogs.find(d => d.id === documentId)
    if (!document) continue
    
    const existing = resultsMap.get(documentId)
    if (existing) {
      // Если документ уже есть (из поиска по имени), объединяем
      existing.score = Math.max(existing.score, result.score)
      existing.matchType = 'both'
      if (!existing.chunk) {
        existing.chunk = {
          id: result.id as string,
          content: result.payload?.content as string,
          chunkIndex: result.payload?.chunkIndex as number,
        }
      }
    } else {
      resultsMap.set(documentId, {
        document,
        score: result.score,
        chunk: {
          id: result.id as string,
          content: result.payload?.content as string,
          chunkIndex: result.payload?.chunkIndex as number,
        },
        matchType: 'vector',
      })
    }
  }
  
  // Добавляем результаты поиска по имени файла
  for (const filenameResult of filenameSearchResults) {
    const documentId = filenameResult.document.id
    const document = documentsWithCatalogs.find(d => d.id === documentId)
    if (!document) continue
    
    const existing = resultsMap.get(documentId)
    if (existing) {
      // Если документ уже есть (из векторного поиска), объединяем
      existing.score = Math.max(existing.score, filenameResult.score)
      existing.matchType = 'both'
    } else {
      // Ищем лучший chunk для этого документа из векторных результатов (используем отфильтрованные)
      const bestChunk = filteredVectorResults
        .filter(r => r.payload?.documentId === documentId)
        .sort((a, b) => (b.score || 0) - (a.score || 0))[0]
      
      resultsMap.set(documentId, {
        document,
        score: filenameResult.score,
        chunk: bestChunk ? {
          id: bestChunk.id as string,
          content: bestChunk.payload?.content as string,
          chunkIndex: bestChunk.payload?.chunkIndex as number,
        } : undefined,
        matchType: 'filename',
      })
    }
  }
  
  // Сортируем по релевантности и ограничиваем
  const searchResults = Array.from(resultsMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => ({
      document: r.document,
      score: r.score,
      chunk: r.chunk || {
        id: '',
        // Fallback: используем больше текста из документа для лучшего контекста
        content: r.document.contentText?.substring(0, 2000) || '',
        chunkIndex: 0,
      },
    }))

  return searchResults
}

