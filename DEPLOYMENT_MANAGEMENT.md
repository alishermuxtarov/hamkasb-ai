# Управление деплойментом Hamkasb.AI

## Быстрые команды

### Перезапуск приложений

```bash
# Перезапустить все приложения
ssh alisher@75.119.128.223 "pm2 restart all"

# Перезапустить только API (бэкенд)
ssh alisher@75.119.128.223 "pm2 restart hamkasb-api"

# Перезапустить только Web (фронтенд)
ssh alisher@75.119.128.223 "pm2 restart hamkasb-web"

# Перезапустить с обновлением переменных окружения
ssh alisher@75.119.128.223 "pm2 restart all --update-env"
```

### Просмотр логов

```bash
# Логи всех приложений (в реальном времени)
ssh alisher@75.119.128.223 "pm2 logs"

# Логи только API
ssh alisher@75.119.128.223 "pm2 logs hamkasb-api"

# Логи только Web
ssh alisher@75.119.128.223 "pm2 logs hamkasb-web"

# Последние 100 строк логов API
ssh alisher@75.119.128.223 "pm2 logs hamkasb-api --lines 100 --nostream"

# Последние 100 строк логов Web
ssh alisher@75.119.128.223 "pm2 logs hamkasb-web --lines 100 --nostream"

# Логи ошибок API
ssh alisher@75.119.128.223 "pm2 logs hamkasb-api --err --lines 50 --nostream"

# Логи ошибок Web
ssh alisher@75.119.128.223 "pm2 logs hamkasb-web --err --lines 50 --nostream"
```

### Статус приложений

```bash
# Статус всех процессов
ssh alisher@75.119.128.223 "pm2 status"

# Детальная информация о процессе
ssh alisher@75.119.128.223 "pm2 describe hamkasb-api"
ssh alisher@75.119.128.223 "pm2 describe hamkasb-web"

# Мониторинг в реальном времени
ssh alisher@75.119.128.223 "pm2 monit"
```

### Выкатка обновлений

#### Полная выкатка (рекомендуется)

```bash
# Из корня проекта
./deployment/deploy-direct.sh
```

Этот скрипт:
- Обновит код из репозитория
- Установит зависимости
- Пересоберет приложения
- Применит миграции БД
- Перезапустит сервисы через PM2

#### Быстрое обновление (только код, без пересборки)

```bash
# Обновить код и перезапустить
ssh alisher@75.119.128.223 << 'ENDSSH'
cd /opt/hamkasb-ai
git fetch origin
git reset --hard origin/master
git clean -fd
pm2 restart all
ENDSSH
```

#### Обновление только бэкенда

```bash
ssh alisher@75.119.128.223 << 'ENDSSH'
cd /opt/hamkasb-ai
git pull origin master
cd apps/api
bun install
bun run build
pm2 restart hamkasb-api
ENDSSH
```

#### Обновление только фронтенда

```bash
ssh alisher@75.119.128.223 << 'ENDSSH'
cd /opt/hamkasb-ai
git pull origin master
cd apps/web
pnpm install
pnpm build
mkdir -p .next/standalone/apps/web/.next
cp -r .next/static .next/standalone/apps/web/.next/ 2>/dev/null || true
pm2 restart hamkasb-web
ENDSSH
```

## Управление переменными окружения

### Обновление .env.production

```bash
# Загрузить локальный .env.production на сервер
scp .env.production alisher@75.119.128.223:/opt/hamkasb-ai/.env.production

# Перезапустить приложения для применения изменений
ssh alisher@75.119.128.223 "pm2 restart all --update-env"
```

### Просмотр текущих переменных окружения

```bash
# Просмотреть .env.production на сервере
ssh alisher@75.119.128.223 "cat /opt/hamkasb-ai/.env.production"
```

## Полезные команды PM2

```bash
# Сохранить текущую конфигурацию PM2
ssh alisher@75.119.128.223 "pm2 save"

# Остановить все приложения
ssh alisher@75.119.128.223 "pm2 stop all"

# Запустить все приложения
ssh alisher@75.119.128.223 "pm2 start all"

# Удалить процесс из PM2
ssh alisher@75.119.128.223 "pm2 delete hamkasb-api"

# Перезагрузить PM2 (после изменений в конфигурации)
ssh alisher@75.119.128.223 "pm2 reload all"

# Очистить все логи
ssh alisher@75.119.128.223 "pm2 flush"
```

## Проверка работоспособности

```bash
# Проверить API
curl http://hamkasb-ai.uz/api/health

# Проверить Web
curl -I http://hamkasb-ai.uz/demo

# Проверить статические файлы
curl -I http://hamkasb-ai.uz/demo/_next/static/css/956acdb2926e13ab.css

# Проверить логи Nginx
ssh alisher@75.119.128.223 "sudo tail -f /var/log/nginx/hamkasb-ai.access.log"
ssh alisher@75.119.128.223 "sudo tail -f /var/log/nginx/hamkasb-ai.error.log"
```

## Миграции базы данных

```bash
# Применить миграции
ssh alisher@75.119.128.223 << 'ENDSSH'
cd /opt/hamkasb-ai
bun run db:migrate
ENDSSH

# Создать новую миграцию (локально)
bun run db:generate

# Просмотреть статус миграций
ssh alisher@75.119.128.223 << 'ENDSSH'
cd /opt/hamkasb-ai/apps/api
bun run db:studio
ENDSSH
```

## Устранение неполадок

### Приложение не запускается

```bash
# Проверить логи ошибок
ssh alisher@75.119.128.223 "pm2 logs --err --lines 50"

# Проверить статус
ssh alisher@75.119.128.223 "pm2 status"

# Проверить порты
ssh alisher@75.119.128.223 "sudo lsof -i :3000 -i :3001"
```

### Проблемы с зависимостями

```bash
# Переустановить зависимости API
ssh alisher@75.119.128.223 << 'ENDSSH'
cd /opt/hamkasb-ai/apps/api
rm -rf node_modules
bun install
ENDSSH

# Переустановить зависимости Web
ssh alisher@75.119.128.223 << 'ENDSSH'
cd /opt/hamkasb-ai/apps/web
rm -rf node_modules
pnpm install
ENDSSH
```

### Проблемы с Nginx

```bash
# Проверить конфигурацию Nginx
ssh alisher@75.119.128.223 "sudo nginx -t"

# Перезагрузить Nginx
ssh alisher@75.119.128.223 "sudo systemctl reload nginx"

# Перезапустить Nginx
ssh alisher@75.119.128.223 "sudo systemctl restart nginx"
```

## Автоматизация

### Создать alias для быстрого доступа

Добавьте в `~/.bashrc` или `~/.zshrc`:

```bash
# Hamkasb.AI deployment aliases
alias hamkasb-logs='ssh alisher@75.119.128.223 "pm2 logs"'
alias hamkasb-status='ssh alisher@75.119.128.223 "pm2 status"'
alias hamkasb-restart='ssh alisher@75.119.128.223 "pm2 restart all"'
alias hamkasb-deploy='./deployment/deploy-direct.sh'
```

### Скрипт для быстрого деплоймента

Создайте файл `deploy.sh` в корне проекта:

```bash
#!/bin/bash
./deployment/deploy-direct.sh
```

Сделайте его исполняемым:

```bash
chmod +x deploy.sh
```

Использование:

```bash
./deploy.sh
```

