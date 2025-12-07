import { put, del, head } from '@vercel/blob'

/**
 * Загрузка файла в Vercel Blob Storage
 */
export async function uploadFile(
  filename: string,
  file: File | Buffer,
  options?: {
    access?: 'public' | 'private'
    contentType?: string
  }
): Promise<{ url: string }> {
  // Получаем токен из переменных окружения при каждом вызове
  // Это гарантирует, что переменная будет доступна даже если .env загружен после импорта модуля
  const blobReadWriteToken = process.env.BLOB_READ_WRITE_TOKEN

  if (!blobReadWriteToken) {
    // Для локальной разработки можно использовать файловую систему
    if (process.env.NODE_ENV === 'development') {
      return uploadFileLocal(filename, file, options)
    }
    throw new Error('BLOB_READ_WRITE_TOKEN environment variable is required')
  }

  try {
    // Преобразуем Buffer в Blob для Vercel Blob API
    const fileData = file instanceof File ? file : new Blob([file])
    const access = (options?.access ?? 'public') as 'public'
    
    const blob = await put(filename, fileData, {
      access,
      token: blobReadWriteToken,
      contentType: options?.contentType,
    })

    return { url: blob.url }
  } catch (error) {
    console.error('❌ Error uploading file to Vercel Blob:', error)
    throw error
  }
}

/**
 * Удаление файла из Vercel Blob Storage
 */
export async function deleteFile(url: string): Promise<void> {
  const blobReadWriteToken = process.env.BLOB_READ_WRITE_TOKEN

  if (!blobReadWriteToken) {
    console.warn('⚠️ BLOB_READ_WRITE_TOKEN not set, skipping file deletion')
    return
  }

  try {
    await del(url, { token: blobReadWriteToken })
  } catch (error) {
    console.error('❌ Error deleting file from Vercel Blob:', error)
    throw error
  }
}

/**
 * Проверка существования файла
 */
export async function fileExists(url: string): Promise<boolean> {
  const blobReadWriteToken = process.env.BLOB_READ_WRITE_TOKEN

  if (!blobReadWriteToken) {
    return false
  }

  try {
    await head(url, { token: blobReadWriteToken })
    return true
  } catch {
    return false
  }
}

/**
 * Локальная загрузка файла (для разработки)
 */
async function uploadFileLocal(
  filename: string,
  file: File | Buffer,
  _options?: {
    access?: 'public' | 'private'
    contentType?: string
  }
): Promise<{ url: string }> {
  const fs = await import('fs/promises')
  const path = await import('path')

  const storageDir = './storage'
  const filePath = path.join(storageDir, filename)

  // Создаем директорию если не существует
  await fs.mkdir(storageDir, { recursive: true })

  // Сохраняем файл
  const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file
  await fs.writeFile(filePath, buffer)

  // Возвращаем локальный URL
  const url = `http://localhost:3001/storage/${filename}`
  return { url }
}

