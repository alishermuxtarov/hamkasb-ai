# 🚀 Deployment Guide - Hamkasb.AI

Профессиональное руководство по развертыванию приложения на сервере **hamkasb-ai.uz**

## 📋 Содержание

- [Архитектура деплоймента](#архитектура-деплоймента)
- [Предварительные требования](#предварительные-требования)
- [Быстрый старт](#быстрый-старт)
- [Ручное развертывание](#ручное-развертывание)
- [Настройка SSL](#настройка-ssl)
- [Мониторинг и логи](#мониторинг-и-логи)
- [Обновление приложения](#обновление-приложения)
- [Troubleshooting](#troubleshooting)

## 🏗️ Архитектура деплоймента

```
┌─────────────────────────────────────────────────────────┐
│                  hamkasb-ai.uz                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Nginx (Port 80/443)                                    │
│  ├── / (root)          → Static Landing Page           │
│  ├── /demo/*           → Next.js Frontend (Port 3000)  │
│  └── /api/*            → Elysia API (Port 3001)        │
│                                                          │
│  Docker Containers:                                     │
│  ├── hamkasb-web       → Next.js 15 + React            │
│  └── hamkasb-api       → Bun + Elysia.js               │
│                                                          │
│  External Services:                                     │
│  ├── PostgreSQL        → Database                       │
│  ├── Qdrant Cloud      → Vector Database               │
│  ├── OpenAI API        → LLM & Embeddings              │
│  └── Vercel Blob       → File Storage                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 📦 Предварительные требования

### На локальной машине:
- Git
- SSH доступ к серверу hamkasb-ai.uz
- Настроенный SSH ключ

### На сервере (устанавливается автоматически):
- Ubuntu 20.04+ / Debian 11+
- Docker & Docker Compose
- Nginx
- Git

## ⚡ Быстрый старт

### 1. Создать .env.production файл

```bash
cd /Users/alex/Projects/pet/hamkasb-ai
cp .env.production.example .env.production
```

Отредактировать `.env.production` с production значениями.

### 2. Загрузить .env.production на сервер

```bash
scp .env.production root@hamkasb-ai.uz:/opt/hamkasb-ai/.env.production
```

### 3. Запустить deployment скрипт

```bash
./deployment/deploy.sh
```

Скрипт автоматически:
- ✅ Установит все зависимости (Docker, Nginx, Git)
- ✅ Склонирует/обновит репозиторий
- ✅ Соберет Docker образы
- ✅ Запустит контейнеры
- ✅ Настроит Nginx
- ✅ Применит database migrations

## 🔧 Ручное развертывание

Если вы предпочитаете ручной контроль:

### Шаг 1: Подключиться к серверу

```bash
ssh root@hamkasb-ai.uz
```

### Шаг 2: Установить зависимости

```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# Docker Compose
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d'"' -f4)
curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Nginx
apt-get update
apt-get install -y nginx git
systemctl enable nginx
systemctl start nginx
```

### Шаг 3: Клонировать репозиторий

```bash
mkdir -p /opt/hamkasb-ai
cd /opt/hamkasb-ai
git clone https://github.com/alishermuxtarov/hamkasb-ai.git .
```

### Шаг 4: Настроить environment variables

```bash
# Создать .env.production файл
nano .env.production
```

Добавить production переменные (см. `.env.production.example`).

### Шаг 5: Собрать и запустить контейнеры

```bash
cd /opt/hamkasb-ai

# Собрать образы
docker-compose -f docker-compose.production.yml build

# Запустить контейнеры
docker-compose -f docker-compose.production.yml up -d

# Проверить статус
docker-compose -f docker-compose.production.yml ps
```

### Шаг 6: Настроить Nginx

```bash
# Копировать конфигурацию
cp deployment/nginx/hamkasb-ai.conf /etc/nginx/sites-available/hamkasb-ai
ln -s /etc/nginx/sites-available/hamkasb-ai /etc/nginx/sites-enabled/

# Проверить конфигурацию
nginx -t

# Перезагрузить Nginx
systemctl reload nginx
```

### Шаг 7: Применить database migrations

```bash
docker exec hamkasb-api bun run db:migrate
```

### Шаг 8: Разместить статическую landing page

```bash
# Создать директорию для landing page
mkdir -p /var/www/hamkasb-landing

# Скопировать существующую landing page
# (предполагается, что она уже на сервере)
```

## 🔒 Настройка SSL (Let's Encrypt)

### Установить Certbot

```bash
apt-get update
apt-get install -y certbot python3-certbot-nginx
```

### Получить SSL сертификат

```bash
certbot --nginx -d hamkasb-ai.uz -d www.hamkasb-ai.uz
```

### Обновить .env.production с HTTPS URLs

```bash
nano /opt/hamkasb-ai/.env.production
```

Изменить:
```bash
NEXT_PUBLIC_APP_URL=https://hamkasb-ai.uz
NEXT_PUBLIC_API_URL=https://hamkasb-ai.uz/api
```

### Перезапустить контейнеры

```bash
cd /opt/hamkasb-ai
docker-compose -f docker-compose.production.yml restart
```

### Автообновление сертификата

Certbot автоматически добавляет cron job для обновления. Проверить:

```bash
systemctl status certbot.timer
```

## 📊 Мониторинг и логи

### Проверить статус контейнеров

```bash
docker ps --filter name=hamkasb
```

### Просмотр логов

```bash
# Все логи
docker-compose -f docker-compose.production.yml logs

# Логи API
docker logs hamkasb-api -f

# Логи Web
docker logs hamkasb-web -f

# Nginx логи
tail -f /var/log/nginx/hamkasb-ai.access.log
tail -f /var/log/nginx/hamkasb-ai.error.log
```

### Health checks

```bash
# API health
curl http://localhost:3001/health

# Web health (через Nginx)
curl http://hamkasb-ai.uz/demo

# Full health check
docker ps --filter name=hamkasb --format "table {{.Names}}\t{{.Status}}"
```

### Мониторинг ресурсов

```bash
# CPU и память контейнеров
docker stats hamkasb-api hamkasb-web

# Дисковое пространство
df -h
docker system df
```

## 🔄 Обновление приложения

### Автоматическое обновление

```bash
./deployment/deploy.sh
```

### Ручное обновление

```bash
ssh root@hamkasb-ai.uz

cd /opt/hamkasb-ai

# Получить последние изменения
git fetch origin
git reset --hard origin/main

# Пересобрать и перезапустить
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# Применить миграции
docker exec hamkasb-api bun run db:migrate
```

### Zero-downtime deployment (опционально)

Для production с высокой нагрузкой:

```bash
# Запустить новые контейнеры параллельно
docker-compose -f docker-compose.production.yml up -d --scale web=2 --scale api=2

# Остановить старые контейнеры
# (требует настройки load balancer в Nginx)
```

## 🐛 Troubleshooting

### Контейнеры не запускаются

```bash
# Проверить логи
docker-compose -f docker-compose.production.yml logs

# Проверить .env.production
cat .env.production

# Проверить порты
netstat -tulpn | grep -E '3000|3001'
```

### Database connection errors

```bash
# Проверить DATABASE_URL в .env.production
# Проверить доступность PostgreSQL
docker exec hamkasb-api bun run -e "console.log(process.env.DATABASE_URL)"

# Применить миграции
docker exec hamkasb-api bun run db:migrate
```

### Nginx 502 Bad Gateway

```bash
# Проверить, что контейнеры запущены
docker ps

# Проверить логи Nginx
tail -f /var/log/nginx/hamkasb-ai.error.log

# Проверить Nginx конфигурацию
nginx -t

# Перезапустить Nginx
systemctl restart nginx
```

### Out of disk space

```bash
# Очистить старые Docker образы
docker system prune -a

# Очистить логи
truncate -s 0 /var/log/nginx/*.log
docker-compose -f docker-compose.production.yml logs --tail=0
```

### API не отвечает

```bash
# Перезапустить API контейнер
docker restart hamkasb-api

# Проверить health endpoint
curl http://localhost:3001/health

# Проверить логи
docker logs hamkasb-api --tail=100
```

## 🎯 Best Practices

### Security

- ✅ Всегда используйте HTTPS в production
- ✅ Держите .env.production в секрете (не комитьте в git)
- ✅ Регулярно обновляйте зависимости и Docker образы
- ✅ Настройте firewall (UFW/iptables)
- ✅ Используйте strong passwords для PostgreSQL

### Performance

- ✅ Включите Nginx кэширование для статических ресурсов
- ✅ Мониторьте использование памяти контейнеров
- ✅ Настройте log rotation
- ✅ Используйте CDN для статических assets (опционально)

### Backup

```bash
# Backup PostgreSQL
docker exec hamkasb-api pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Backup .env.production
cp /opt/hamkasb-ai/.env.production ~/backups/env-$(date +%Y%m%d)
```

## 📞 Support

- **Repository**: https://github.com/alishermuxtarov/hamkasb-ai
- **Documentation**: См. WARP.md, SETUP.md, MAKEFILE.md

---

**Разработано командой Quantum для AI500! Hackathon 2025** 🚀
