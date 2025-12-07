# 📋 Техническое задание: Hamkasb.AI - Этап 2

**Дата создания:** 6 декабря 2025  
**Проект:** Hamkasb.AI - AI Коллега для банков и организаций  
**Хакатон:** AI500! Hackathon 2025 от AgroBank Uzbekistan  
**Этап:** 2 - Демо-версия приложения

---

## 🎯 Цель этапа

Создать рабочую демо-версию приложения с полноценной реализацией агента "Библиотекарь" и mock-интерфейсами для всех остальных агентов системы. Приложение должно быть готово к демонстрации в виде видео (1-5 минут) и иметь live-доступ без авторизации.

---

## 🛠 Технологический стек

### Backend
- **Runtime:** Bun.js 1.x
- **Framework:** Elysia.js
- **AI SDK:** Vercel AI SDK v6 (agent-first)
- **Database:** Vercel Postgres (production) / PostgreSQL (local)
- **Vector DB:** Qdrant Cloud (demo) / Qdrant self-hosted (production)
- **Storage:** Vercel Blob (production) / Local filesystem (local)

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **UI Components:** shadcn/ui
- **State Management:** React Query (TanStack Query) + Zustand
- **AI Integration:** @ai-sdk/react (useChat, useCompletion)
- **Internationalization:** next-intl или i18next

### Инфраструктура
- **Deployment:** Vercel
- **Package Manager:** pnpm (или Bun)
- **Version Control:** Git
- **CI/CD:** Vercel автоматический деплой

---

## 📁 Структура проекта

### Рекомендуемая структура: Монорепозиторий

```
hamkasb-ai/
├── package.json                 # Root workspace config
├── bun.lockb                    # Bun lockfile
├── tsconfig.base.json          # Shared TypeScript config
├── vercel.json                 # Vercel config (Bun runtime)
├── .env.local                   # Local environment variables
├── .env.example                 # Example env file
│
├── apps/
│   ├── web/                     # Next.js frontend
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── (dashboard)/     # Dashboard routes
│   │   │   │   ├── agents/      # Agent pages
│   │   │   │   │   ├── librarian/
│   │   │   │   │   ├── docflow/
│   │   │   │   │   ├── kyc/
│   │   │   │   │   └── ...
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── api/             # Next.js API routes (proxy to Elysia)
│   │   │   ├── demo/            # Demo page
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/          # React components
│   │   │   ├── agents/          # Agent-specific components
│   │   │   ├── chat/            # Chat components
│   │   │   ├── documents/       # Document components
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   └── ...
│   │   ├── lib/                 # Frontend utilities
│   │   │   ├── i18n/           # Internationalization
│   │   │   ├── api/            # API client
│   │   │   └── utils/
│   │   ├── hooks/              # Custom React hooks
│   │   ├── public/             # Static assets
│   │   ├── styles/             # Global styles
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── api/                     # Elysia backend
│       ├── src/
│       │   ├── index.ts        # Elysia app entrypoint
│       │   ├── routes/         # API routes
│       │   │   ├── agents/     # Agent endpoints
│       │   │   │   ├── librarian.ts
│       │   │   │   ├── docflow.ts
│       │   │   │   └── ...
│       │   │   ├── chat/        # Chat endpoints
│       │   │   ├── documents/   # Document endpoints
│       │   │   └── health.ts
│       │   ├── agents/         # AI Agent implementations
│       │   │   ├── librarian/
│       │   │   │   ├── agent.ts      # ToolLoopAgent
│       │   │   │   ├── tools.ts     # Agent tools
│       │   │   │   └── prompts.ts   # System prompts
│       │   │   └── ...
│       │   ├── services/        # Business logic
│       │   │   ├── qdrant.ts    # Vector DB service
│       │   │   ├── postgres.ts  # Database service
│       │   │   ├── blob.ts      # File storage service
│       │   │   ├── embeddings.ts # Embedding service
│       │   │   └── ...
│       │   ├── lib/            # Backend utilities
│       │   │   ├── db/         # Database schemas & migrations
│       │   │   ├── validators/ # Zod schemas
│       │   │   └── ...
│       │   ├── plugins/        # Elysia plugins
│       │   │   ├── cors.ts
│       │   │   ├── rate-limit.ts
│       │   │   └── ...
│       │   └── types/          # TypeScript types
│       ├── package.json
│       └── tsconfig.json
│
└── packages/                    # Shared packages
    ├── ui/                      # Shared UI components
    │   ├── components/
    │   └── package.json
    ├── core/                    # Shared domain logic
    │   ├── types/              # Shared types
    │   ├── constants/         # Constants
    │   ├── utils/             # Shared utilities
    │   └── package.json
    ├── config/                 # Shared configs
    │   ├── eslint/
    │   ├── typescript/
    │   └── package.json
    └── i18n/                   # Shared i18n resources
        ├── locales/
        │   ├── ru.json
        │   ├── uz.json
        │   ├── kaa.json
        │   └── en.json
        └── package.json
```

### Альтернатива: Раздельные проекты (если монорепозиторий сложен)

```
hamkasb-ai-frontend/            # Next.js проект
hamkasb-ai-backend/             # Elysia проект
```

**Рекомендация:** Использовать монорепозиторий для лучшей интеграции и переиспользования кода.

---

## 🗄 База данных (Vercel Postgres)

### Подключение к БД

**Локальная разработка:**
```typescript
// apps/api/src/lib/db/index.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export { pool };
```

**Production (Vercel):**
```typescript
// apps/api/src/lib/db/index.ts
import { sql } from '@vercel/postgres';

export { sql };
```

Или использовать ORM (Prisma/Drizzle), который абстрагирует разницу.

### Схема для истории чата

```sql
-- Сессии чата
CREATE TABLE chat_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id TEXT NOT NULL,              -- ID агента (librarian, docflow, etc.)
  user_id TEXT,                         -- Для будущей авторизации
  title TEXT,                           -- Название сессии
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Сообщения чата
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chat_session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT,                         -- Текст сообщения
  tool_calls JSONB,                     -- Tool calls (если есть)
  tool_results JSONB,                   -- Tool results (если есть)
  metadata JSONB,                       -- Дополнительные метаданные
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Индексы
CREATE INDEX idx_chat_messages_session ON chat_messages(chat_session_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX idx_chat_sessions_agent ON chat_sessions(agent_id);
```

### Схема для агента "Библиотекарь"

```sql
-- Документы
CREATE TABLE documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  blob_url TEXT,                        -- URL в Vercel Blob
  content_text TEXT,                   -- Извлеченный текст
  content_html TEXT,                    -- HTML версия (для DOCX)
  metadata JSONB,                       -- Метаданные документа
  catalog_id TEXT,                      -- ID каталога
  client_id TEXT,                       -- ID клиента (если привязан)
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Каталоги документов
CREATE TABLE document_catalogs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  parent_id TEXT REFERENCES document_catalogs(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Chunks для векторного поиска
CREATE TABLE document_chunks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  start_char INTEGER,
  end_char INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(document_id, chunk_index)
);

-- Индексы
CREATE INDEX idx_documents_catalog ON documents(catalog_id);
CREATE INDEX idx_documents_client ON documents(client_id);
CREATE INDEX idx_document_chunks_document ON document_chunks(document_id);
```

### Миграции

Использовать инструмент для миграций:
- **Prisma** (рекомендуется для TypeScript)
- **Drizzle ORM** (легковесный)
- **Raw SQL** с версионированием

---

## 🤖 AI Агенты

### Агент "Библиотекарь" (Librarian) - Полная реализация

#### Инструменты агента (Tools)

```typescript
// tools.ts
import { tool } from 'ai';
import { z } from 'zod';

export const librarianTools = {
  // Поиск документов по векторной БД
  searchDocuments: tool({
    description: 'Поиск документов в библиотеке по запросу на естественном языке',
    parameters: z.object({
      query: z.string().describe('Поисковый запрос'),
      catalogId: z.string().optional().describe('ID каталога для фильтрации'),
      limit: z.number().default(5).describe('Количество результатов'),
    }),
    execute: async ({ query, catalogId, limit }) => {
      // 1. Генерация embedding для запроса
      // 2. Поиск в Qdrant
      // 3. Возврат результатов с метаданными
    },
  }),

  // Получение документа по ID
  getDocument: tool({
    description: 'Получить полную информацию о документе по его ID',
    parameters: z.object({
      documentId: z.string(),
    }),
    execute: async ({ documentId }) => {
      // Получение из Postgres + Blob
    },
  }),

  // Создание каталога
  createCatalog: tool({
    description: 'Создать новый каталог для организации документов',
    parameters: z.object({
      name: z.string(),
      description: z.string().optional(),
      parentId: z.string().optional(),
    }),
    execute: async ({ name, description, parentId }) => {
      // Создание в Postgres
    },
  }),

  // Загрузка документа
  uploadDocument: tool({
    description: 'Загрузить новый документ в библиотеку',
    parameters: z.object({
      filename: z.string(),
      content: z.string().describe('Base64 encoded file content'),
      catalogId: z.string().optional(),
      clientId: z.string().optional(),
    }),
    execute: async ({ filename, content, catalogId, clientId }) => {
      // 1. Декодирование файла
      // 2. Извлечение текста (PDF/DOCX)
      // 3. Сохранение в Blob
      // 4. Сохранение метаданных в Postgres
      // 5. Разбиение на chunks
      // 6. Генерация embeddings
      // 7. Сохранение в Qdrant
    },
  }),

  // Резюме документа
  summarizeDocument: tool({
    description: 'Создать краткое резюме документа',
    parameters: z.object({
      documentId: z.string(),
      language: z.enum(['ru', 'uz', 'en', 'kaa']).optional(),
    }),
    execute: async ({ documentId, language }) => {
      // Получение документа + LLM summarization
    },
  }),

  // Перевод документа
  translateDocument: tool({
    description: 'Перевести документ на другой язык',
    parameters: z.object({
      documentId: z.string(),
      targetLanguage: z.enum(['ru', 'uz', 'en', 'kaa']),
    }),
    execute: async ({ documentId, targetLanguage }) => {
      // LLM translation
    },
  }),

  // Извлечение данных в таблицу
  extractToTable: tool({
    description: 'Извлечь структурированные данные из документа в таблицу',
    parameters: z.object({
      documentId: z.string(),
      fields: z.array(z.object({
        name: z.string(),
        description: z.string(),
        type: z.enum(['text', 'date', 'number', 'boolean']),
      })),
    }),
    execute: async ({ documentId, fields }) => {
      // LLM extraction + structured output
    },
  }),
};
```

#### Системный промпт

```typescript
// prompts.ts
export const librarianSystemPrompt = `
Ты - Библиотекарь, AI-агент для управления документами организации.

Твои обязанности:
- Помогать сотрудникам находить нужные документы
- Организовывать документы в каталоги
- Извлекать информацию из документов
- Переводить документы на разные языки
- Создавать резюме документов
- Извлекать структурированные данные

Ты вежливый, профессиональный и всегда готов помочь. Отвечай на языке пользователя.
`;
```

#### Реализация агента

```typescript
// agent.ts
import { ToolLoopAgent } from 'ai';
import { openai } from '@ai-sdk/openai';
import { librarianTools } from './tools';
import { librarianSystemPrompt } from './prompts';

export const librarianAgent = new ToolLoopAgent({
  model: openai('gpt-4-turbo'),
  id: 'librarian',
  instructions: librarianSystemPrompt,
  tools: librarianTools,
  stopWhen: async ({ steps }) => {
    // Остановка после 20 шагов или когда агент завершил задачу
    return steps.length >= 20 || steps.at(-1)?.finishReason === 'stop';
  },
  maxOutputTokens: 4096,
});
```

### Mock-агенты (для интерфейса)

Для остальных агентов создать mock-реализации с базовым функционалом:

- **Docflow (Документооборот)** - детальный mock с изучением узбекской канцелярии
- **KYC Agent** - базовый mock
- **Financier** - базовый mock
- **HR** - базовый mock
- **Support** - базовый mock
- **Marketer** - базовый mock
- **PR Specialist** - базовый mock
- **Designer** - базовый mock
- **SMM Specialist** - базовый mock

---

## 🌐 Интерфейс приложения

### Требования к интерфейсу

1. **Современный дизайн:**
   - Использовать shadcn/ui компоненты
   - Следовать принципам Material Design 3 или Apple HIG
   - Адаптивный дизайн (mobile-first)
   - Темная/светлая тема

2. **Многоязычность:**
   - Поддержка 4 языков: Русский (по умолчанию), Узбекский, Каракалпакский, Английский
   - Использовать next-intl или i18next
   - Все новые сообщения должны добавляться на все языки
   - Переключение языка в header

3. **Структура интерфейса:**
   - Dashboard с обзором всех агентов
   - Страница для каждого агента
   - Чат-интерфейс для каждого агента
   - Навигация между агентами

### Компоненты интерфейса

#### Dashboard
- Карточки агентов с кратким описанием
- Статистика использования
- Быстрый доступ к последним сессиям

#### Страница агента
- Боковая панель с историей чата
- Основная область с чатом
- Панель инструментов (для Библиотекаря: загрузка, каталоги, поиск)
- Информация об агенте

#### Чат-компонент
- Список сообщений с поддержкой streaming
- Поле ввода с поддержкой markdown
- Отображение tool calls и результатов
- Citations для RAG ответов
- Кнопки действий (копировать, перевести, и т.д.)

### Интерфейс агента "Документооборот" (Docflow)

Изучить узбекскую систему документооборота и создать детальный mock:

**Основные элементы:**
- Входящие документы (список с фильтрами)
- Исходящие документы
- Внутренние документы
- Резолюции и поручения
- Контроль исполнения
- Маршруты согласования
- Архив документов
- Поиск по документам
- Статистика и аналитика

**Особенности узбекского документооборота:**
- Регистрация входящих/исходящих документов
- Резолюции руководителей
- Контроль сроков исполнения
- Согласование документов
- Электронная подпись (EIMZO)
- Интеграция с ЭДО системами

---

## 🔧 Конфигурация и настройка

### Vercel Configuration

```json
// vercel.json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "bunVersion": "1.x",
  "buildCommand": "cd apps/web && pnpm build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "functions": {
    "apps/api/src/**/*.ts": {
      "runtime": "bun@1.x",
      "maxDuration": 300
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/proxy/:path*"
    }
  ]
}
```

### Environment Variables

```bash
# .env.local
# Database
POSTGRES_URL=postgresql://...
POSTGRES_PRISMA_URL=postgresql://...
POSTGRES_URL_NON_POOLING=postgresql://...

# Vercel Blob
BLOB_READ_WRITE_TOKEN=...

# Qdrant
QDRANT_URL=https://...
QDRANT_API_KEY=...

# OpenAI
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Локальная разработка

#### Запуск локального Postgres

**Вариант 1: Docker Compose (рекомендуется)**

```yaml
# docker-compose.yml в корне проекта
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: hamkasb
      POSTGRES_PASSWORD: hamkasb_dev
      POSTGRES_DB: hamkasb_ai
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hamkasb"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

```bash
# Запуск
docker-compose up -d postgres

# Проверка
docker-compose ps
```

**Вариант 2: Локальный Postgres**

```bash
# Установка (macOS)
brew install postgresql@16
brew services start postgresql@16

# Создание БД
createdb hamkasb_ai

# Подключение
psql hamkasb_ai
```

#### Environment Variables для локальной разработки

**Важно:** Для локальной разработки используйте обычный `pg` драйвер, а не `@vercel/postgres`. `@vercel/postgres` предназначен только для Vercel Postgres с pooled URL.

```bash
# .env.local
# Локальный Postgres (используем обычный pg драйвер)
DATABASE_URL=postgresql://hamkasb:hamkasb_dev@localhost:5432/hamkasb_ai

# Для production на Vercel (используем @vercel/postgres)
# POSTGRES_URL=postgresql://... (автоматически генерируется Vercel)
# POSTGRES_PRISMA_URL=postgresql://...?pgbouncer=true
# POSTGRES_URL_NON_POOLING=postgresql://...

# Qdrant (можно использовать Cloud для демо)
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-api-key

# Vercel Blob (можно использовать локальное хранилище для разработки)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... # или использовать локальную файловую систему

# OpenAI
OPENAI_API_KEY=sk-...

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Запуск приложения

**Root level scripts (рекомендуется):**

```json
// package.json (root)
{
  "scripts": {
    "dev": "concurrently \"bun run dev:api\" \"bun run dev:web\"",
    "dev:api": "cd apps/api && bun run dev",
    "dev:web": "cd apps/web && pnpm dev",
    "build": "bun run build:api && bun run build:web",
    "build:api": "cd apps/api && bun run build",
    "build:web": "cd apps/web && pnpm build"
  }
}
```

```bash
# Установка зависимостей
pnpm install

# Запуск всего проекта
pnpm dev

# Или по отдельности:
# Backend (Elysia) на порту 3001
cd apps/api && bun run dev

# Frontend (Next.js) на порту 3000
cd apps/web && pnpm dev
```

#### Миграции БД

**С Prisma (рекомендуется):**

```bash
cd apps/api

# Инициализация Prisma
npx prisma init

# Создание миграции
npx prisma migrate dev --name init

# Применение миграций
npx prisma migrate deploy

# Генерация Prisma Client
npx prisma generate

# Просмотр БД в Prisma Studio
npx prisma studio
```

**С Drizzle ORM:**

```bash
cd apps/api

# Создание миграции
bun run db:generate

# Применение миграции
bun run db:migrate

# Просмотр схемы
bun run db:studio
```

#### Локальное хранилище файлов (альтернатива Vercel Blob)

Для локальной разработки можно использовать локальную файловую систему:

```typescript
// apps/api/src/services/storage.ts
export const storageService = {
  async upload(file: File, path: string): Promise<string> {
    if (process.env.NODE_ENV === 'development') {
      // Локальное хранилище
      const fs = await import('fs/promises');
      const buffer = await file.arrayBuffer();
      const localPath = `./storage/${path}`;
      await fs.mkdir(`./storage/${path.split('/').slice(0, -1).join('/')}`, { recursive: true });
      await fs.writeFile(localPath, Buffer.from(buffer));
      return `http://localhost:3001/storage/${path}`;
    } else {
      // Vercel Blob
      const { put } = await import('@vercel/blob');
      const blob = await put(path, file, { access: 'public' });
      return blob.url;
    }
  },
};
```

---

## 📡 API Endpoints

### Backend API (Elysia)

```
POST   /api/chat/:agentId          # Чат с агентом
GET    /api/chat/:agentId/sessions # Список сессий
GET    /api/chat/:agentId/sessions/:sessionId # История чата
DELETE /api/chat/:agentId/sessions/:sessionId # Удалить сессию

# Агент Библиотекарь
POST   /api/agents/librarian/documents/upload # Загрузить документ
GET    /api/agents/librarian/documents       # Список документов
GET    /api/agents/librarian/documents/:id    # Получить документ
POST   /api/agents/librarian/documents/search # Поиск документов
POST   /api/agents/librarian/catalogs        # Создать каталог
GET    /api/agents/librarian/catalogs        # Список каталогов

# Health check
GET    /api/health
```

### Frontend API Routes (Next.js Proxy)

Next.js API routes будут проксировать запросы к Elysia backend:

```typescript
// app/api/proxy/[...path]/route.ts
export async function POST(req: Request) {
  const path = req.url.split('/api/proxy/')[1];
  const response = await fetch(`${process.env.API_URL}/api/${path}`, {
    method: 'POST',
    body: await req.text(),
    headers: req.headers,
  });
  return response;
}
```

---

## 🚀 План разработки

### Фаза 1: Настройка проекта (4-6 часов)

1. ✅ Создать монорепозиторий
2. ✅ Настроить Bun workspaces
3. ✅ Настроить Next.js проект
4. ✅ Настроить Elysia проект
5. ✅ Настроить Vercel конфигурацию
6. ✅ Настроить TypeScript конфигурацию
7. ✅ Настроить ESLint и Prettier
8. ✅ Настроить локальный Postgres

### Фаза 2: Базовая инфраструктура (6-8 часов)

1. ✅ Настроить подключение к Postgres
2. ✅ Создать схемы БД и миграции
3. ✅ Настроить подключение к Qdrant
4. ✅ Настроить Vercel Blob
5. ✅ Создать базовые сервисы (DB, Qdrant, Blob, Embeddings)
6. ✅ Настроить i18n
7. ✅ Создать базовые UI компоненты (shadcn/ui)

### Фаза 3: Агент "Библиотекарь" - Backend (8-10 часов)

1. ✅ Реализовать инструменты агента
2. ✅ Реализовать ToolLoopAgent
3. ✅ Реализовать обработку документов (PDF, DOCX)
4. ✅ Реализовать векторизацию и сохранение в Qdrant
5. ✅ Реализовать API endpoints
6. ✅ Реализовать сохранение истории чата

### Фаза 4: Агент "Библиотекарь" - Frontend (8-10 часов)

1. ✅ Создать страницу агента
2. ✅ Создать чат-компонент с streaming
3. ✅ Создать компонент загрузки документов
4. ✅ Создать компонент каталогов
5. ✅ Создать компонент поиска документов
6. ✅ Интегрировать с backend API

### Фаза 5: Mock-агенты и интерфейсы (6-8 часов)

1. ✅ Создать Dashboard
2. ✅ Создать mock-интерфейсы для всех агентов
3. ✅ Детально проработать интерфейс Docflow
4. ✅ Добавить навигацию между агентами
5. ✅ Добавить переключение языков

### Фаза 6: Полировка и тестирование (4-6 часов)

1. ✅ Тестирование всех функций
2. ✅ Исправление багов
3. ✅ Оптимизация производительности
4. ✅ Добавление loading states
5. ✅ Обработка ошибок
6. ✅ Подготовка к деплою

### Фаза 7: Деплой и документация (2-4 часа)

1. ✅ Настройка Vercel
2. ✅ Настройка окружений
3. ✅ Деплой на Vercel
4. ✅ Создание страницы /demo
5. ✅ Документация API
6. ✅ README с инструкциями

**Общее время:** 38-52 часа (5-7 рабочих дней)

---

## 📝 Best Practices

### Backend (Elysia + Bun)

1. **Type Safety:**
   - Использовать Zod для валидации
   - Строгая типизация всех endpoints
   - Type-safe database queries

2. **Error Handling:**
   - Централизованная обработка ошибок
   - Структурированные error responses
   - Логирование ошибок

3. **Performance:**
   - Кэширование частых запросов
   - Оптимизация database queries
   - Batch operations где возможно

4. **Security:**
   - Валидация всех входных данных
   - Sanitization пользовательского ввода
   - Rate limiting

### Frontend (Next.js)

1. **Performance:**
   - Server Components где возможно
   - Code splitting
   - Image optimization
   - Lazy loading

2. **UX:**
   - Loading states
   - Error boundaries
   - Optimistic updates
   - Skeleton loaders

3. **Accessibility:**
   - Semantic HTML
   - ARIA labels
   - Keyboard navigation
   - Screen reader support

### AI Agents

1. **Tool Design:**
   - Четкие описания инструментов
   - Валидация параметров
   - Обработка ошибок в execute
   - Логирование tool calls

2. **Prompt Engineering:**
   - Четкие инструкции
   - Примеры использования
   - Контекст пользователя
   - Многоязычность

3. **RAG Optimization:**
   - Качественные chunks
   - Релевантный контекст
   - Ограничение размера контекста
   - Re-ranking результатов

---

## ✅ Чеклист готовности

### Техническая часть
- [ ] Монорепозиторий настроен
- [ ] Backend (Elysia) работает локально
- [ ] Frontend (Next.js) работает локально
- [ ] Postgres подключен и миграции применены
- [ ] Qdrant подключен и работает
- [ ] Vercel Blob настроен
- [ ] Агент "Библиотекарь" полностью реализован
- [ ] История чата сохраняется в Postgres
- [ ] Mock-интерфейсы для всех агентов
- [ ] Интерфейс Docflow детально проработан
- [ ] Многоязычность работает (4 языка)
- [ ] Приложение деплоится на Vercel

### Функциональная часть
- [ ] Загрузка документов работает
- [ ] Поиск документов работает
- [ ] Чат с агентом работает со streaming
- [ ] Каталоги документов работают
- [ ] Резюме документов работает
- [ ] Перевод документов работает
- [ ] Все mock-интерфейсы отображаются
- [ ] Навигация между агентами работает

### UI/UX
- [ ] Дизайн современный и продуманный
- [ ] Адаптивный дизайн работает
- [ ] Темная/светлая тема работает
- [ ] Все компоненты shadcn/ui интегрированы
- [ ] Loading states добавлены
- [ ] Error handling работает
- [ ] Переключение языков работает

### Документация
- [ ] README с инструкциями
- [ ] API документация
- [ ] Страница /demo создана
- [ ] Описание функционала готово
- [ ] Стек технологий описан

---

## 🎬 Демо-видео

### Сценарий демо (1-5 минут)

1. **Вступление (30 сек):**
   - Показать Dashboard с агентами
   - Объяснить концепцию системы

2. **Агент "Библиотекарь" (2-3 мин):**
   - Загрузка документа
   - Поиск документов
   - Чат с агентом
   - Создание каталога
   - Резюме документа

3. **Mock-интерфейсы (1 мин):**
   - Показать интерфейс Docflow
   - Показать другие агенты

4. **Заключение (30 сек):**
   - Показать технический стек
   - Показать следующие шаги

---

## 📚 Дополнительные ресурсы

### Документация
- [Vercel AI SDK v6](https://sdk.vercel.ai/docs)
- [Elysia.js](https://elysiajs.com/)
- [Bun.js](https://bun.sh/docs)
- [Next.js](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Qdrant](https://qdrant.tech/documentation/)

### Примеры
- [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot)
- [Elysia Vercel Template](https://vercel.com/templates/other/elysia-on-vercel)

---

**Документ подготовлен:** 6 декабря 2025  
**Для проекта:** Hamkasb.AI - AI500! Hackathon 2025

