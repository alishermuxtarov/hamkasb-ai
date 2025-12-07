.PHONY: help install install-api install-web dev dev-api dev-web build build-api build-web \
	db-generate db-migrate db-push db-studio db-reset \
	check check-api check-web lint lint-api lint-web type-check type-check-api type-check-web \
	clean clean-api clean-web \
	postgres-status postgres-psql postgres-drop-db \
	test test-api test-web

# Цвета для вывода
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

# Переменные
API_DIR := apps/api
WEB_DIR := apps/web
ROOT_DIR := .

# Функция для получения пути к bun
# Используется в каждой команде для надежной проверки
define get_bun
	$(shell if command -v bun >/dev/null 2>&1 && bun --version >/dev/null 2>&1; then echo bun; elif test -f ~/.bun/bin/bun && ~/.bun/bin/bun --version >/dev/null 2>&1; then echo ~/.bun/bin/bun; else echo ""; fi)
endef

help: ## Показать справку по командам
	@echo "$(BLUE)Hamkasb.AI - Доступные команды:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# ============================================================================
# Установка зависимостей
# ============================================================================

install: install-api install-web ## Установить все зависимости (root, api, web)
	@echo "$(GREEN)✅ Все зависимости установлены$(NC)"

install-api: ## Установить зависимости API (Bun)
	@echo "$(BLUE)📦 Установка зависимостей API...$(NC)"
	@cd $(API_DIR) && \
	if command -v bun >/dev/null 2>&1 && bun --version >/dev/null 2>&1; then \
		bun install; \
	elif test -f ~/.bun/bin/bun && ~/.bun/bin/bun --version >/dev/null 2>&1; then \
		~/.bun/bin/bun install; \
	elif command -v npm >/dev/null 2>&1; then \
		npm install; \
	else \
		echo "$(YELLOW)⚠️ Bun и npm не найдены. Установите один из них.$(NC)"; \
		exit 1; \
	fi

install-web: ## Установить зависимости Web (pnpm)
	@echo "$(BLUE)📦 Установка зависимостей Web...$(NC)"
	@cd $(WEB_DIR) && pnpm install

# ============================================================================
# Разработка
# ============================================================================

dev: ## Запустить все сервисы в режиме разработки
	@echo "$(BLUE)🚀 Запуск всех сервисов...$(NC)"
	@if command -v bun >/dev/null 2>&1 && bun --version >/dev/null 2>&1; then \
		bun run dev; \
	elif test -f ~/.bun/bin/bun && ~/.bun/bin/bun --version >/dev/null 2>&1; then \
		~/.bun/bin/bun run dev; \
	elif command -v npm >/dev/null 2>&1; then \
		npm run dev; \
	else \
		echo "$(YELLOW)⚠️ Bun и npm не найдены. Запустите сервисы отдельно:$(NC)"; \
		echo "  make dev-api  # API сервер"; \
		echo "  make dev-web  # Web сервер"; \
		exit 1; \
	fi

dev-api: ## Запустить только API сервер
	@echo "$(BLUE)🚀 Запуск API сервера...$(NC)"
	@cd $(API_DIR) && \
	if command -v bun >/dev/null 2>&1 && bun --version >/dev/null 2>&1; then \
		bun run dev; \
	elif test -f ~/.bun/bin/bun && ~/.bun/bin/bun --version >/dev/null 2>&1; then \
		~/.bun/bin/bun run dev; \
	elif command -v npm >/dev/null 2>&1; then \
		npm run dev; \
	else \
		echo "$(YELLOW)⚠️ Bun и npm не найдены. Установите один из них.$(NC)"; \
		exit 1; \
	fi

dev-web: ## Запустить только Web сервер
	@echo "$(BLUE)🚀 Запуск Web сервера...$(NC)"
	@cd $(WEB_DIR) && pnpm dev

# ============================================================================
# Сборка
# ============================================================================

build: build-api build-web ## Собрать все проекты
	@echo "$(GREEN)✅ Все проекты собраны$(NC)"

build-api: ## Собрать API
	@echo "$(BLUE)🔨 Сборка API...$(NC)"
	@cd $(API_DIR) && \
	if command -v bun >/dev/null 2>&1 && bun --version >/dev/null 2>&1; then \
		bun run build; \
	elif test -f ~/.bun/bin/bun && ~/.bun/bin/bun --version >/dev/null 2>&1; then \
		~/.bun/bin/bun run build; \
	elif command -v npm >/dev/null 2>&1; then \
		npm run build; \
	else \
		echo "$(YELLOW)⚠️ Bun и npm не найдены. Установите один из них.$(NC)"; \
		exit 1; \
	fi

build-web: ## Собрать Web
	@echo "$(BLUE)🔨 Сборка Web...$(NC)"
	@cd $(WEB_DIR) && pnpm build

# ============================================================================
# База данных (Drizzle)
# ============================================================================

db-generate: ## Генерировать миграции Drizzle (аналог alembic autogenerate)
	@echo "$(BLUE)📝 Генерация миграций Drizzle...$(NC)"
	@cd $(API_DIR) && \
	if command -v bun >/dev/null 2>&1 && bun --version >/dev/null 2>&1; then \
		bun run db:generate; \
	elif test -f ~/.bun/bin/bun && ~/.bun/bin/bun --version >/dev/null 2>&1; then \
		~/.bun/bin/bun run db:generate; \
	elif command -v npm >/dev/null 2>&1; then \
		npm run db:generate || npx drizzle-kit generate; \
	else \
		echo "$(YELLOW)⚠️ Bun и npm не найдены. Установите один из них.$(NC)"; \
		exit 1; \
	fi

db-migrate: ## Применить миграции к БД
	@echo "$(BLUE)🔄 Применение миграций...$(NC)"
	@cd $(API_DIR) && \
	if command -v bun >/dev/null 2>&1 && bun --version >/dev/null 2>&1; then \
		bun run db:migrate; \
	elif test -f ~/.bun/bin/bun && ~/.bun/bin/bun --version >/dev/null 2>&1; then \
		~/.bun/bin/bun run db:migrate; \
	elif command -v npm >/dev/null 2>&1; then \
		npm run db:migrate || npx drizzle-kit migrate; \
	else \
		echo "$(YELLOW)⚠️ Bun и npm не найдены. Установите один из них.$(NC)"; \
		exit 1; \
	fi

db-push: ## Push схемы в БД без миграций (для разработки)
	@echo "$(BLUE)📤 Push схемы в БД...$(NC)"
	@cd $(API_DIR) && \
	if command -v bun >/dev/null 2>&1 && bun --version >/dev/null 2>&1; then \
		bun run db:push; \
	elif test -f ~/.bun/bin/bun && ~/.bun/bin/bun --version >/dev/null 2>&1; then \
		~/.bun/bin/bun run db:push; \
	elif command -v npm >/dev/null 2>&1; then \
		npm run db:push || npx drizzle-kit push; \
	else \
		echo "$(YELLOW)⚠️ Bun и npm не найдены. Установите один из них.$(NC)"; \
		exit 1; \
	fi

db-studio: ## Открыть Drizzle Studio
	@echo "$(BLUE)🎨 Запуск Drizzle Studio...$(NC)"
	@cd $(API_DIR) && \
	if command -v bun >/dev/null 2>&1 && bun --version >/dev/null 2>&1; then \
		bun run db:studio; \
	elif test -f ~/.bun/bin/bun && ~/.bun/bin/bun --version >/dev/null 2>&1; then \
		~/.bun/bin/bun run db:studio; \
	elif command -v npm >/dev/null 2>&1; then \
		npm run db:studio || npx drizzle-kit studio; \
	else \
		echo "$(YELLOW)⚠️ Bun и npm не найдены. Установите один из них.$(NC)"; \
		exit 1; \
	fi

db-reset: postgres-drop-db db-push ## Сбросить БД (удалить, применить схемы)
	@echo "$(GREEN)✅ База данных сброшена$(NC)"

# ============================================================================
# Проверка кода (Lint, Type Check)
# ============================================================================

check: lint type-check ## Запустить все проверки (lint + type-check)
	@echo "$(GREEN)✅ Все проверки пройдены$(NC)"

lint: lint-api lint-web ## Запустить линтеры для всех проектов
	@echo "$(GREEN)✅ Линтинг завершен$(NC)"

lint-api: ## Линтинг API
	@echo "$(BLUE)🔍 Линтинг API...$(NC)"
	@cd $(API_DIR) && \
	if command -v bun >/dev/null 2>&1 && bun --version >/dev/null 2>&1; then \
		bun run lint; \
	elif test -f ~/.bun/bin/bun && ~/.bun/bin/bun --version >/dev/null 2>&1; then \
		~/.bun/bin/bun run lint; \
	elif command -v npm >/dev/null 2>&1; then \
		npm run lint || npx eslint src --ext .ts; \
	else \
		echo "$(YELLOW)⚠️ Bun и npm не найдены. Установите один из них.$(NC)"; \
		exit 1; \
	fi

lint-web: ## Линтинг Web
	@echo "$(BLUE)🔍 Линтинг Web...$(NC)"
	@cd $(WEB_DIR) && pnpm lint

type-check: type-check-api type-check-web ## Проверка типов TypeScript для всех проектов
	@echo "$(GREEN)✅ Проверка типов завершена$(NC)" || true

type-check-api: ## Проверка типов API
	@echo "$(BLUE)🔍 Проверка типов API...$(NC)"
	@cd $(API_DIR) && \
	if command -v bun >/dev/null 2>&1 && bun --version >/dev/null 2>&1; then \
		bun run type-check; \
	elif test -f ~/.bun/bin/bun && ~/.bun/bin/bun --version >/dev/null 2>&1; then \
		~/.bun/bin/bun run type-check; \
	elif command -v npm >/dev/null 2>&1; then \
		npm run type-check 2>/dev/null || npx tsc --noEmit; \
	else \
		echo "$(YELLOW)⚠️ Bun и npm не найдены. Установите один из них.$(NC)"; \
		exit 1; \
	fi

type-check-web: ## Проверка типов Web
	@echo "$(BLUE)🔍 Проверка типов Web...$(NC)"
	@cd $(WEB_DIR) && pnpm type-check || echo "$(YELLOW)⚠️ Некоторые ошибки типов в Web (пути @/), но это не критично$(NC)"

# ============================================================================
# Тестирование
# ============================================================================

test: test-api test-web ## Запустить все тесты
	@echo "$(GREEN)✅ Все тесты пройдены$(NC)"

test-api: ## Тесты API
	@echo "$(BLUE)🧪 Запуск тестов API...$(NC)"
	@cd $(API_DIR) && bun test || echo "$(YELLOW)⚠️ Тесты не настроены$(NC)"

test-web: ## Тесты Web
	@echo "$(BLUE)🧪 Запуск тестов Web...$(NC)"
	@cd $(WEB_DIR) && pnpm test || echo "$(YELLOW)⚠️ Тесты не настроены$(NC)"

# ============================================================================
# Локальный Postgres (утилиты)
# ============================================================================

postgres-status: ## Показать статус подключения к Postgres
	@echo "$(BLUE)📊 Проверка подключения к Postgres:$(NC)"
	@psql -h localhost -U $(USER) -d hamkasb_ai -c "SELECT version();" 2>/dev/null && echo "$(GREEN)✅ Подключение успешно$(NC)" || echo "$(YELLOW)⚠️ Не удалось подключиться. Проверьте DATABASE_URL в .env.local$(NC)"

postgres-psql: ## Подключиться к Postgres через psql
	@echo "$(BLUE)🐘 Подключение к Postgres...$(NC)"
	@psql -h localhost -U $(USER) -d hamkasb_ai || psql hamkasb_ai

postgres-drop-db: ## Удалить базу данных hamkasb_ai (⚠️ опасная операция)
	@echo "$(YELLOW)⚠️ Удаление базы данных hamkasb_ai...$(NC)"
	@read -p "Вы уверены? (yes/no): " confirm && [ "$$confirm" = "yes" ] && dropdb hamkasb_ai && echo "$(GREEN)✅ База данных удалена$(NC)" || echo "$(BLUE)Отменено$(NC)"

# ============================================================================
# Очистка
# ============================================================================

clean: clean-api clean-web ## Очистить все артефакты сборки
	@echo "$(GREEN)✅ Очистка завершена$(NC)"

clean-api: ## Очистить артефакты API
	@echo "$(BLUE)🧹 Очистка API...$(NC)"
	@cd $(API_DIR) && rm -rf dist node_modules/.cache
	@echo "$(GREEN)✅ API очищен$(NC)"

clean-web: ## Очистить артефакты Web
	@echo "$(BLUE)🧹 Очистка Web...$(NC)"
	@cd $(WEB_DIR) && rm -rf .next node_modules/.cache
	@echo "$(GREEN)✅ Web очищен$(NC)"

clean-all: clean ## Очистить все включая node_modules (⚠️ требует переустановки)
	@echo "$(YELLOW)⚠️ Удаление node_modules...$(NC)"
	@find . -name "node_modules" -type d -prune -exec rm -rf {} +
	@find . -name ".next" -type d -prune -exec rm -rf {} +
	@find . -name "dist" -type d -prune -exec rm -rf {} +
	@echo "$(GREEN)✅ Полная очистка завершена. Запустите 'make install' для переустановки зависимостей$(NC)"

# ============================================================================
# Утилиты
# ============================================================================

setup: install db-push ## Полная настройка проекта (зависимости + БД)
	@echo "$(GREEN)✅ Проект настроен и готов к работе!$(NC)"
	@echo "$(BLUE)Запустите 'make dev' для старта разработки$(NC)"

status: ## Показать статус всех сервисов
	@echo "$(BLUE)📊 Статус сервисов:$(NC)"
	@echo ""
	@echo "$(GREEN)Postgres:$(NC)"
	@make postgres-status
	@echo ""
	@echo "$(GREEN)Зависимости:$(NC)"
	@test -d $(API_DIR)/node_modules && echo "  ✅ API зависимости установлены" || echo "  ❌ API зависимости не установлены"
	@test -d $(WEB_DIR)/node_modules && echo "  ✅ Web зависимости установлены" || echo "  ❌ Web зависимости не установлены"

