import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Document {
  id: string
  filename: string
  mimeType: string
  size: number
  blobUrl: string | null
  catalogId: string | null
  createdAt: string
  catalog?: {
    id: string
    name: string
  } | null
}

export interface DocumentDetail extends Document {
  contentText: string | null
  contentHtml: string | null
  contentMarkdown?: Record<'ru' | 'en' | 'uz' | 'kaa', string> | null
  summary?: Record<'ru' | 'en' | 'uz' | 'kaa', string> | null
  metadata?: Record<string, unknown> | null
  chunksCount: number
}

export interface Catalog {
  id: string
  name: string
  description: string | null
  parentId: string | null
  createdAt: string
}

export interface DocumentsResponse {
  documents: Document[]
  count: number
}

export interface CatalogsResponse {
  catalogs: Catalog[]
}

export interface SearchResult {
  document: {
    id: string
    filename: string
    mimeType: string
    catalog: {
      id: string
      name: string
    } | null
  }
  score: number
  preview: string
}

export interface SearchResponse {
  results: SearchResult[]
  count: number
}

// Fetch documents
export function useDocuments(filters?: { catalogId?: string; clientId?: string; limit?: number }) {
  return useQuery<DocumentsResponse>({
    queryKey: ['documents', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.catalogId) params.set('catalogId', filters.catalogId)
      if (filters?.clientId) params.set('clientId', filters.clientId)
      if (filters?.limit) params.set('limit', String(filters.limit))

      const response = await fetch(`/api/documents?${params.toString()}`)
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch documents' }))
        throw new Error(error.error || 'Failed to fetch documents')
      }
      return response.json()
    },
    retry: 1, // Retry once on failure
  })
}

// Fetch single document
export function useDocument(id: string | null) {
  return useQuery<{ document: DocumentDetail }>({
    queryKey: ['document', id],
    queryFn: async () => {
      if (!id) throw new Error('Document ID is required')
      const response = await fetch(`/api/documents/${id}`)
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch document' }))
        throw new Error(error.error || 'Failed to fetch document')
      }
      return response.json()
    },
    enabled: !!id,
    retry: 1, // Retry once on failure
  })
}

// Fetch catalogs
export function useCatalogs() {
  return useQuery<CatalogsResponse>({
    queryKey: ['catalogs'],
    queryFn: async () => {
      const response = await fetch('/api/catalogs')
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch catalogs' }))
        throw new Error(error.error || 'Failed to fetch catalogs')
      }
      return response.json()
    },
    retry: 1, // Retry once on failure
  })
}

// Upload document
export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { file: File; catalogId?: string; clientId?: string; uploadedBy?: string }) => {
      const formData = new FormData()
      formData.append('file', data.file)
      if (data.catalogId) formData.append('catalogId', data.catalogId)
      if (data.clientId) formData.append('clientId', data.clientId)
      if (data.uploadedBy) formData.append('uploadedBy', data.uploadedBy)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload document')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate documents query to refetch
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

// Search documents
export function useSearchDocuments() {
  return useMutation<SearchResponse, Error, { query: string; catalogId?: string; limit?: number }>({
    mutationFn: async ({ query, catalogId, limit }) => {
      const response = await fetch('/api/documents/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, catalogId, limit }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to search documents')
      }

      return response.json()
    },
  })
}

// Create catalog
export function useCreateCatalog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; parentId?: string }) => {
      const response = await fetch('/api/catalogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create catalog')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs'] })
    },
  })
}

