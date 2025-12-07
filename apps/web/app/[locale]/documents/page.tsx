'use client'

import React, { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AgentChatPanel } from '@/components/chat/agent-chat-panel'
import {
  useDocuments,
  useCatalogs,
  useDocument,
  useUploadDocument,
  useSearchDocuments,
  useCreateCatalog,
  type Document as DocumentType,
} from '@/hooks/use-documents'
import { Upload, Search, FileText, X, File, Folder, Calendar, HardDrive, Loader2, Eye, Plus, FolderPlus, Info } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function DocumentsPage() {
  const t = useTranslations()
  const [showChat, setShowChat] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showCreateCatalogDialog, setShowCreateCatalogDialog] = useState(false)
  const [newCatalogName, setNewCatalogName] = useState('')
  const [newCatalogDescription, setNewCatalogDescription] = useState('')
  const [uploadCatalogId, setUploadCatalogId] = useState<string | undefined>(undefined)
  const [activeLanguage, setActiveLanguage] = useState<'ru' | 'en' | 'uz' | 'kaa'>('ru')
  const [activeTab, setActiveTab] = useState<'content' | 'summary'>('content')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const languageNames: Record<'ru' | 'en' | 'uz' | 'kaa', string> = {
    ru: 'Русский',
    en: 'English',
    uz: 'Oʻzbekcha',
    kaa: 'Qaraqalpaqsha',
  }

  // Fetch data
  const { data: documentsData, isLoading: isLoadingDocuments, refetch: refetchDocuments } = useDocuments({
    catalogId: selectedCatalogId || undefined,
    limit: 100,
  })
  const { data: catalogsData, isLoading: isLoadingCatalogs } = useCatalogs()
  const { data: documentDetail, isLoading: isLoadingDocument } = useDocument(selectedDocumentId)
  const uploadMutation = useUploadDocument()
  const searchMutation = useSearchDocuments()
  const createCatalogMutation = useCreateCatalog()

  const documents = documentsData?.documents || []
  const catalogs = catalogsData?.catalogs || []

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileType = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'pdf'
    if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) return 'docx'
    if (mimeType.includes('spreadsheetml') || mimeType.includes('ms-excel')) return 'xlsx'
    if (mimeType.includes('presentationml') || mimeType.includes('ms-powerpoint')) return 'pptx'
    if (mimeType.includes('markdown') || mimeType.includes('md')) return 'md'
    if (mimeType.includes('text/plain') || mimeType.includes('txt')) return 'txt'
    return 'file'
  }

  const getFileIcon = (mimeType: string) => {
    const type = getFileType(mimeType)
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />
      case 'xlsx':
        return <FileText className="h-5 w-5 text-green-500" />
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />
      case 'pptx':
        return <FileText className="h-5 w-5 text-orange-500" />
      case 'md':
        return <FileText className="h-5 w-5 text-purple-500" />
      case 'txt':
        return <FileText className="h-5 w-5 text-gray-500" />
      default:
        return <File className="h-5 w-5 text-muted-foreground" />
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await uploadMutation.mutateAsync({
        file,
        catalogId: uploadCatalogId || selectedCatalogId || undefined,
      })
      setShowUploadDialog(false)
      setUploadCatalogId(undefined)
      refetchDocuments()
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  const handleCreateCatalog = async () => {
    if (!newCatalogName.trim()) return

    try {
      await createCatalogMutation.mutateAsync({
        name: newCatalogName.trim(),
        description: newCatalogDescription.trim() || undefined,
        parentId: selectedCatalogId || undefined,
      })
      setShowCreateCatalogDialog(false)
      setNewCatalogName('')
      setNewCatalogDescription('')
    } catch (error) {
      console.error('Error creating catalog:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      refetchDocuments()
      return
    }

    try {
      await searchMutation.mutateAsync({
        query: searchQuery,
        catalogId: selectedCatalogId || undefined,
        limit: 50,
      })
    } catch (error) {
      console.error('Error searching documents:', error)
    }
  }

  const filteredDocuments: DocumentType[] = searchMutation.data
    ? searchMutation.data.results.map((r) => ({
        id: r.document.id,
        filename: r.document.filename,
        mimeType: r.document.mimeType,
        size: 0, // Search results don't include size
        createdAt: new Date().toISOString(), // Use current date as fallback
        catalogId: r.document.catalog?.id || null,
        blobUrl: null,
        catalog: r.document.catalog,
      }))
    : documents.filter((doc) => {
        if (searchQuery) {
          return doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
        }
        return true
      })

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy', { locale: ru })
    } catch {
      return dateString
    }
  }

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('documents.title')}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Управление документами и файлами организации
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowChat(!showChat)}>
                  {showChat ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Скрыть чат
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Открыть чат
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => {
                    setUploadCatalogId(selectedCatalogId || undefined)
                    setShowUploadDialog(true)
                  }} 
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {t('documents.upload')}
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('documents.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch()
                    }
                  }}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={searchMutation.isPending}>
                {searchMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Catalogs */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-muted-foreground">Каталоги</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateCatalogDialog(true)}
                  className="h-8"
                >
                  <FolderPlus className="h-3 w-3 mr-1" />
                  Создать каталог
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedCatalogId === null ? 'default' : 'secondary'}
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => setSelectedCatalogId(null)}
                >
                  Все
                </Badge>
                {isLoadingCatalogs ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  catalogs.map((catalog) => (
                    <Badge
                      key={catalog.id}
                      variant={selectedCatalogId === catalog.id ? 'default' : 'secondary'}
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => setSelectedCatalogId(catalog.id)}
                    >
                      {catalog.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* Documents Grid */}
            {isLoadingDocuments ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : documentsData?.documents ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredDocuments.map((doc) => (
                    <Card
                      key={doc.id}
                      className="group hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/50"
                      onClick={() => setSelectedDocumentId(doc.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="rounded-lg bg-muted p-2">
                            {getFileIcon(doc.mimeType)}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getFileType(doc.mimeType).toUpperCase()}
                          </Badge>
                        </div>
                        <CardTitle className="text-sm font-medium line-clamp-2 leading-snug">
                          {doc.filename}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {doc.size > 0 && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <HardDrive className="h-3 w-3" />
                            <span>{formatFileSize(doc.size)}</span>
                          </div>
                        )}
                        {doc.createdAt && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(doc.createdAt)}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t">
                          <Badge variant="secondary" className="text-xs">
                            {doc.catalog?.name || 'Без каталога'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredDocuments.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Документы не найдены</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery
                        ? 'Попробуйте изменить параметры поиска'
                        : 'Загрузите первый документ, чтобы начать работу'}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ошибка загрузки документов</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Не удалось загрузить документы. Проверьте подключение к серверу.
                </p>
                <Button variant="outline" onClick={() => refetchDocuments()}>
                  Попробовать снова
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="flex-shrink-0">
          <AgentChatPanel
            agentId="librarian"
            agentName="Библиотекарь"
            promptSuggestions={[
              'Расскажи о хакатоне AI500',
              'Расскажи о команде Hamkasb AI',
              'Расскажи о проекте Hamkasb AI',
              'Какие проблемы решает проект Hamkasb AI?',
            ]}
            position="relative"
          />
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Загрузить документ</DialogTitle>
            <DialogDescription>
              Выберите файл и каталог для загрузки. Поддерживаются форматы PDF и DOCX.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="file-upload-input" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
                Файл
              </label>
              <Input
                id="file-upload-input"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md,.markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                onChange={handleFileUpload}
                disabled={uploadMutation.isPending}
              />
            </div>
            <div>
              <label htmlFor="catalog-select-upload" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
                Каталог (необязательно)
              </label>
              <select
                id="catalog-select-upload"
                value={uploadCatalogId || ''}
                onChange={(e) => setUploadCatalogId(e.target.value || undefined)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Без каталога</option>
                {catalogs.map((catalog) => (
                  <option key={catalog.id} value={catalog.id}>
                    {catalog.name}
                  </option>
                ))}
              </select>
            </div>
            {uploadMutation.isError && (
              <p className="text-sm text-destructive">
                Ошибка загрузки: {uploadMutation.error?.message || 'Неизвестная ошибка'}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Catalog Dialog */}
      <Dialog open={showCreateCatalogDialog} onOpenChange={setShowCreateCatalogDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать каталог</DialogTitle>
            <DialogDescription>
              Создайте новый каталог для организации документов
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="catalog-name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
                Название каталога *
              </label>
              <Input
                id="catalog-name"
                value={newCatalogName}
                onChange={(e) => setNewCatalogName(e.target.value)}
                placeholder="Введите название каталога"
              />
            </div>
            <div>
              <label htmlFor="catalog-description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
                Описание (необязательно)
              </label>
              <Input
                id="catalog-description"
                value={newCatalogDescription}
                onChange={(e) => setNewCatalogDescription(e.target.value)}
                placeholder="Введите описание каталога"
              />
            </div>
            {selectedCatalogId && (
              <div className="text-sm text-muted-foreground">
                Каталог будет создан в: <Badge variant="secondary">{catalogs.find(c => c.id === selectedCatalogId)?.name || 'Выбранный каталог'}</Badge>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCreateCatalogDialog(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleCreateCatalog} 
              disabled={!newCatalogName.trim() || createCatalogMutation.isPending}
            >
              {createCatalogMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать
                </>
              )}
            </Button>
          </div>
          {createCatalogMutation.isError && (
            <p className="text-sm text-destructive mt-2">
              Ошибка создания каталога: {createCatalogMutation.error?.message || 'Неизвестная ошибка'}
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Document View Dialog */}
      <Dialog open={!!selectedDocumentId} onOpenChange={(open) => !open && setSelectedDocumentId(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-start justify-between shrink-0">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold mb-3 truncate">
                {isLoadingDocument ? (
                  <Loader2 className="h-4 w-4 animate-spin inline" />
                ) : (
                  documentDetail?.document.filename || 'Документ'
                )}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {documentDetail?.document.catalog?.name && (
                  <Badge variant="secondary" className="text-xs">
                    <Folder className="h-3 w-3 mr-1" />
                    {documentDetail.document.catalog.name}
                  </Badge>
                )}
                {documentDetail?.document.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(documentDetail.document.createdAt)}
                  </span>
                )}
                {documentDetail?.document.blobUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(documentDetail.document.blobUrl!, '_blank')}
                    className="h-7 px-2 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Оригинал
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Content */}
          {isLoadingDocument ? (
            <div className="flex items-center justify-center py-12 flex-1">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : documentDetail ? (
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'content' | 'summary')} className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="px-6 pt-4 pb-2 border-b shrink-0">
                  <TabsList className="grid w-full max-w-md grid-cols-2 mb-3">
                    <TabsTrigger value="content">Содержание</TabsTrigger>
                    <TabsTrigger value="summary">Краткое содержание</TabsTrigger>
                  </TabsList>
                  
                  {/* Language Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Язык:</span>
                    <div className="flex gap-1">
                      {(['ru', 'en', 'uz', 'kaa'] as const).map((lang) => (
                        <Button
                          key={lang}
                          variant={activeLanguage === lang ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setActiveLanguage(lang)}
                          className="h-7 px-3 text-xs"
                        >
                          {languageNames[lang]}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <TabsContent value="content" className="flex-1 overflow-y-auto px-6 py-4 mt-0 data-[state=active]:flex">
                  {(() => {
                    const markdownContent = documentDetail.document.contentMarkdown?.[activeLanguage]
                    if (markdownContent && markdownContent.trim()) {
                      return (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:my-2 prose-headings:text-base prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:my-2 prose-p:text-sm prose-ul:my-2 prose-ol:my-2 prose-li:text-sm prose-strong:text-sm prose-code:text-xs prose-code:bg-transparent prose-code:text-foreground prose-code:px-0 prose-code:py-0 prose-code:before:content-none prose-code:after:content-none prose-pre:text-xs prose-pre:bg-muted prose-pre:border prose-pre:rounded-md prose-pre:p-3 prose-blockquote:text-sm prose-blockquote:border-l-4 prose-blockquote:border-muted prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:bg-transparent prose-table:text-xs">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {markdownContent}
                          </ReactMarkdown>
                        </div>
                      )
                    }
                    if (documentDetail.document.contentHtml) {
                      return (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: documentDetail.document.contentHtml }}
                        />
                      )
                    }
                    if (documentDetail.document.contentText) {
                      return (
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                          {documentDetail.document.contentText}
                        </div>
                      )
                    }
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Содержимое документа недоступно</p>
                      </div>
                    )
                  })()}
                </TabsContent>

                <TabsContent value="summary" className="flex-1 overflow-y-auto px-6 py-4 mt-0 data-[state=active]:flex">
                  {(() => {
                    const summaryContent = documentDetail.document.summary?.[activeLanguage]
                    if (summaryContent && summaryContent.trim()) {
                      return (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:my-2 prose-headings:text-base prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:my-2 prose-p:text-sm prose-ul:my-2 prose-ol:my-2 prose-li:text-sm prose-strong:text-sm prose-code:text-xs prose-code:bg-transparent prose-code:text-foreground prose-code:px-0 prose-code:py-0 prose-code:before:content-none prose-code:after:content-none prose-pre:text-xs prose-pre:bg-muted prose-pre:border prose-pre:rounded-md prose-pre:p-3 prose-blockquote:text-sm prose-blockquote:border-l-4 prose-blockquote:border-muted prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:bg-transparent">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {summaryContent}
                          </ReactMarkdown>
                        </div>
                      )
                    }
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Info className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Краткое содержание недоступно на выбранном языке</p>
                      </div>
                    )
                  })()}
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
