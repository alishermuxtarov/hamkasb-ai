import { Elysia, t } from 'elysia'
import { processDocument, getDocumentById, searchDocumentsByQuery } from '../services/documents'
import { getDb, schema } from '../lib/db'
import { eq, and } from 'drizzle-orm'

const { documents, documentCatalogs } = schema

/**
 * Routes для агента "Библиотекарь"
 */
export const librarianRoutes = new Elysia({ prefix: '/agents/librarian' })
  /**
   * POST /agents/librarian/documents/upload
   * Загрузка документа
   */
  .post(
    '/documents/upload',
    async ({ request, set }) => {
      try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const catalogId = formData.get('catalogId') as string | null
        const clientId = formData.get('clientId') as string | null
        const uploadedBy = formData.get('uploadedBy') as string | null

        if (!file) {
          set.status = 400
          return {
            error: 'File is required',
          }
        }

        // Обработка документа
        const { id, document } = await processDocument(file, {
          catalogId: catalogId || undefined,
          clientId: clientId || undefined,
          uploadedBy: uploadedBy || undefined,
        })

        return {
          success: true,
          documentId: id,
          document: {
            id: document.id,
            filename: document.originalFilename,
            mimeType: document.mimeType,
            size: document.size,
            blobUrl: document.blobUrl,
            catalogId: document.catalogId,
            createdAt: document.createdAt.toISOString(),
          },
        }
      } catch (error) {
        console.error('❌ Error uploading document:', error)
        set.status = 500
        return {
          error: 'Failed to upload document',
          details: error instanceof Error ? error.message : String(error),
        }
      }
    },
    {
      detail: {
        tags: ['Librarian'],
        summary: 'Загрузить документ',
        description:
          'Загружает документ (PDF или DOCX) в библиотеку. ' +
          'Документ автоматически обрабатывается: извлекается текст, создаются chunks, генерируются embeddings.',
      },
    }
  )

  /**
   * GET /agents/librarian/documents
   * Список документов
   */
  .get(
    '/documents',
    async ({ query }) => {
      const { catalogId, clientId, limit = 50 } = query as {
        catalogId?: string
        clientId?: string
        limit?: number
      }

      const db = getDb()
      const conditions = []

      if (catalogId) {
        conditions.push(eq(documents.catalogId, catalogId))
      }
      if (clientId) {
        conditions.push(eq(documents.clientId, clientId))
      }

      const docs = await db
        .select({
          id: documents.id,
          filename: documents.originalFilename,
          mimeType: documents.mimeType,
          size: documents.size,
          blobUrl: documents.blobUrl,
          catalogId: documents.catalogId,
          createdAt: documents.createdAt,
        })
        .from(documents)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limit)

      return {
        documents: docs,
        count: docs.length,
      }
    },
    {
      query: t.Object({
        catalogId: t.Optional(t.String()),
        clientId: t.Optional(t.String()),
        limit: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['Librarian'],
        summary: 'Получить список документов',
        description:
          'Возвращает список документов с возможностью фильтрации по каталогу или клиенту.',
      },
    }
  )

  /**
   * GET /agents/librarian/documents/:id
   * Получение документа по ID
   */
  .get(
    '/documents/:id',
    async ({ params }) => {
      const { id } = params
      const document = await getDocumentById(id)

      if (!document) {
        return {
          error: 'Document not found',
        }
      }

      return {
        document: {
          id: document.id,
          filename: document.originalFilename,
          mimeType: document.mimeType,
          size: document.size,
          blobUrl: document.blobUrl,
          contentText: document.contentText,
          contentHtml: document.contentHtml,
          contentMarkdown: document.contentMarkdown as Record<'ru' | 'en' | 'uz' | 'kaa', string> | null,
          summary: document.summary as Record<'ru' | 'en' | 'uz' | 'kaa', string> | null,
          metadata: document.metadata as Record<string, unknown> | null,
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
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['Librarian'],
        summary: 'Получить документ по ID',
        description:
          'Возвращает полную информацию о документе, включая содержимое и метаданные.',
      },
    }
  )

  /**
   * POST /agents/librarian/documents/search
   * Поиск документов
   */
  .post(
    '/documents/search',
    async ({ body }) => {
      const { query, catalogId, limit } = body as {
        query: string
        catalogId?: string
        limit?: number
      }

      if (!query) {
        return {
          error: 'Query is required',
        }
      }

      const results = await searchDocumentsByQuery(query, {
        catalogId,
        limit,
      })

      return {
        results: results.map((r) => ({
          document: {
            id: r.document.id,
            filename: r.document.originalFilename,
            mimeType: r.document.mimeType,
            catalog: r.document.catalog
              ? {
                  id: r.document.catalog.id,
                  name: r.document.catalog.name,
                }
              : null,
          },
          score: r.score,
          preview: r.chunk.content,
        })),
        count: results.length,
      }
    },
    {
      body: t.Object({
        query: t.String(),
        catalogId: t.Optional(t.String()),
        limit: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['Librarian'],
        summary: 'Поиск документов',
        description:
          'Выполняет семантический поиск документов по векторной базе данных. ' +
          'Использует embeddings для поиска релевантных документов.',
        examples: [
          {
            description: 'Поиск документов о кредитовании',
            value: {
              query: 'документы о кредитовании фермеров',
              limit: 5,
            },
          },
        ],
      },
    }
  )

  /**
   * POST /agents/librarian/catalogs
   * Создание каталога
   */
  .post(
    '/catalogs',
    async ({ body }) => {
      const { name, description, parentId } = body as {
        name: string
        description?: string
        parentId?: string
      }

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
          error: 'Failed to create catalog',
        }
      }

      return {
        catalog: {
          id: catalog.id,
          name: catalog.name,
          description: catalog.description,
          parentId: catalog.parentId,
          createdAt: catalog.createdAt.toISOString(),
        },
      }
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        parentId: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Librarian'],
        summary: 'Создать каталог',
        description:
          'Создает новый каталог для организации документов. ' +
          'Каталоги могут быть вложенными (через parentId).',
      },
    }
  )

  /**
   * GET /agents/librarian/catalogs
   * Список каталогов
   */
  .get(
    '/catalogs',
    async () => {
      const db = getDb()

      const catalogs = await db.select().from(documentCatalogs)

      return {
        catalogs: catalogs.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          parentId: c.parentId,
          createdAt: c.createdAt.toISOString(),
        })),
      }
    },
    {
      detail: {
        tags: ['Librarian'],
        summary: 'Получить список каталогов',
        description: 'Возвращает список всех каталогов документов.',
      },
    }
  )

