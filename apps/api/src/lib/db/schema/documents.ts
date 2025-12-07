import {
  pgTable,
  text,
  timestamp,
  jsonb,
  bigint,
  integer,
  index,
  unique,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

/**
 * Каталоги документов
 * Используем any для циклической ссылки (parentId ссылается на documentCatalogs.id)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const documentCatalogs: any = pgTable('document_catalogs', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()::text`),
  name: text('name').notNull(),
  description: text('description'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentId: text('parent_id').references((): any => documentCatalogs.id, {
    onDelete: 'set null',
  }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

/**
 * Документы
 */
export const documents = pgTable(
  'documents',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    filename: text('filename').notNull(),
    originalFilename: text('original_filename').notNull(),
    mimeType: text('mime_type').notNull(),
    size: bigint('size', { mode: 'number' }).notNull(),
    blobUrl: text('blob_url'),
    contentText: text('content_text'),
    contentHtml: text('content_html'),
    contentMarkdown: jsonb('content_markdown'), // Markdown контент на 4 языках: {ru, en, uz, kaa}
    summary: jsonb('summary'), // Краткое содержание на 4 языках: {ru, en, uz, kaa}
    metadata: jsonb('metadata'),
    catalogId: text('catalog_id').references(() => documentCatalogs.id, {
      onDelete: 'set null',
    }),
    clientId: text('client_id'),
    uploadedBy: text('uploaded_by'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    catalogIdIdx: index('idx_documents_catalog').on(table.catalogId),
    clientIdIdx: index('idx_documents_client').on(table.clientId),
  })
)

/**
 * Chunks для векторного поиска
 */
export const documentChunks = pgTable(
  'document_chunks',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    documentId: text('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    startChar: integer('start_char'),
    endChar: integer('end_char'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    documentIdIdx: index('idx_document_chunks_document').on(table.documentId),
    documentChunkUnique: unique('unique_document_chunk').on(
      table.documentId,
      table.chunkIndex
    ),
  })
)

/**
 * Relations для документов
 */
export const documentCatalogsRelations = relations(
  documentCatalogs,
  ({ one, many }) => ({
    parent: one(documentCatalogs, {
      fields: [documentCatalogs.parentId],
      references: [documentCatalogs.id],
    }),
    children: many(documentCatalogs),
    documents: many(documents),
  })
)

export const documentsRelations = relations(documents, ({ one, many }) => ({
  catalog: one(documentCatalogs, {
    fields: [documents.catalogId],
    references: [documentCatalogs.id],
  }),
  chunks: many(documentChunks),
}))

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, {
    fields: [documentChunks.documentId],
    references: [documents.id],
  }),
}))

