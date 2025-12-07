# Database Schema

База данных использует Drizzle ORM для типобезопасной работы с PostgreSQL.

## Структура

```
src/lib/db/
├── schema/           # Схемы БД по доменам
│   ├── chat.ts      # Схемы для чата
│   ├── documents.ts # Схемы для документов
│   └── index.ts     # Экспорт всех схем
├── migrations/      # Миграции (генерируются автоматически)
├── index.ts         # Drizzle client
└── types.ts         # TypeScript типы
```

## Использование

### Получение клиента БД

```typescript
import { getDb } from '@/lib/db'
import { chatSessions } from '@/lib/db/schema'

const db = getDb()

// Запрос данных
const sessions = await db.select().from(chatSessions)
```

### Миграции

```bash
# Генерация миграции
bun run db:generate

# Применение миграции
bun run db:migrate

# Push схемы в БД (без миграций)
bun run db:push

# Открыть Drizzle Studio
bun run db:studio
```

## Best Practices

1. **Схемы по доменам**: Каждый домен (chat, documents) имеет свой файл схемы
2. **Relations**: Используются для типобезопасных join'ов
3. **Индексы**: Определяются в определении таблицы для лучшей производительности
4. **Типы**: Автоматически генерируются из схем через `InferSelectModel` и `InferInsertModel`

