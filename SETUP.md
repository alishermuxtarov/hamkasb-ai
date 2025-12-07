# 🚀 Инструкция по настройке проекта

## Предварительные требования

1. **Bun** >= 1.0.0
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Node.js** >= 18.0.0 (для Next.js)
   ```bash
   # Проверка версии
   node --version
   ```

3. **pnpm** (для Next.js проекта)
   ```bash
   npm install -g pnpm
   ```

4. **Docker** (для локального Postgres)
   ```bash
   # Проверка установки
   docker --version
   ```

## Шаг 1: Установка зависимостей

### Установка root зависимостей

```bash
cd /Users/alex/Projects/pet/hamkasb-ai
bun install
```

### Установка зависимостей для Next.js

```bash
cd apps/web
pnpm install
```

### Установка зависимостей для Elysia API

Зависимости для API уже установятся через Bun workspaces при выполнении `bun install` в корне.

## Шаг 2: Настройка окружения

1. Создайте файл `.env.local` в корне проекта:

```bash
cp .env.example .env.local
```

2. Заполните переменные окружения в `.env.local`:

```bash
# Database (для локальной разработки)
DATABASE_URL=postgresql://hamkasb:hamkasb_dev@localhost:5432/hamkasb_ai

# Qdrant (получите на cloud.qdrant.io)
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-api-key

# OpenAI (получите на platform.openai.com)
OPENAI_API_KEY=sk-...

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Шаг 3: Настройка локального Postgres

**Примечание:** Предполагается, что Postgres уже запущен и база данных `hamkasb_ai` уже создана.

### Проверка подключения

```bash
# Проверить статус подключения
make postgres-status

# Подключиться через psql
make postgres-psql
```

### Если нужно создать БД вручную

```bash
# Создание базы данных
createdb hamkasb_ai

# Подключение
psql hamkasb_ai
```

## Шаг 4: Настройка базы данных

### Использование Makefile (рекомендуется)

```bash
# Генерация миграций на основе схем
make db-generate

# Применение миграций к БД
make db-migrate

# Или push схемы без миграций (для разработки)
make db-push
```

### Прямые команды

```bash
cd apps/api

# Генерация миграций на основе схем
bun run db:generate

# Применение миграций к БД
bun run db:migrate

# Или push схемы без миграций (для разработки)
bun run db:push
```

### Просмотр БД в Drizzle Studio

```bash
# Через Makefile
make db-studio

# Или напрямую
cd apps/api
bun run db:studio
```

Откроется веб-интерфейс для просмотра и редактирования данных.

## Шаг 5: Запуск приложения

### Запуск всего проекта (backend + frontend)

```bash
# Из корня проекта
bun run dev
```

Это запустит:
- Elysia API на `http://localhost:3001`
- Next.js на `http://localhost:3000`

### Запуск по отдельности

```bash
# Backend (Elysia)
bun run dev:api
# API будет доступен на http://localhost:3001

# Frontend (Next.js)
bun run dev:web
# Frontend будет доступен на http://localhost:3000
```

## Шаг 6: Проверка работы

1. **Проверка API:**
   ```bash
   curl http://localhost:3001/health
   ```
   Должен вернуть: `{"status":"ok","timestamp":"..."}`

2. **Проверка Frontend:**
   Откройте в браузере: `http://localhost:3000`

## Полезные команды

```bash
# Проверка типов TypeScript
bun run type-check

# Линтинг кода
bun run lint

# Сборка проекта
bun run build

# Работа с БД
cd apps/api
bun run db:generate  # Генерация миграций
bun run db:migrate   # Применение миграций
bun run db:push      # Push схемы (без миграций)
bun run db:studio    # Открыть Drizzle Studio

# Остановка всех процессов
# Нажмите Ctrl+C в терминале где запущен dev
```

## Структура проекта

```
hamkasb-ai/
├── apps/
│   ├── web/          # Next.js frontend (порт 3000)
│   │   ├── app/      # Next.js App Router
│   │   ├── components/
│   │   └── messages/ # i18n переводы
│   └── api/          # Elysia backend (порт 3001)
│       ├── src/
│       │   ├── lib/db/
│       │   │   ├── schema/    # Drizzle схемы
│       │   │   └── migrations/ # Миграции
│       │   ├── routes/        # API routes
│       │   ├── agents/        # AI agents
│       │   └── services/      # Business logic
│       └── drizzle.config.ts  # Drizzle конфигурация
├── packages/
│   ├── core/         # Shared domain logic
│   ├── ui/           # Shared UI components
│   └── i18n/         # Internationalization
├── docker-compose.yml # Локальный Postgres
└── .env.local        # Environment variables (не в git)
```

## База данных (Drizzle ORM)

Проект использует **Drizzle ORM** для типобезопасной работы с PostgreSQL.

### Структура схем

Схемы организованы по доменам:
- `schema/chat.ts` - схемы для чата (сессии, сообщения)
- `schema/documents.ts` - схемы для документов (документы, каталоги, chunks)

### Работа с БД

```typescript
import { getDb } from '@/lib/db'
import { chatSessions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const db = getDb()

// Запрос данных
const sessions = await db
  .select()
  .from(chatSessions)
  .where(eq(chatSessions.agentId, 'librarian'))
```

Подробнее см. `apps/api/src/lib/db/README.md` и `apps/api/src/lib/db/examples.ts`

## Следующие шаги

После успешной настройки проекта переходите к:
- **Фаза 3:** Реализация агента "Библиотекарь" (Backend)
- **Фаза 4:** Реализация агента "Библиотекарь" (Frontend)

Подробный план разработки в `info/stage-2-technical-spec.md`
