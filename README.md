# Angren Game

Минималистичный сайт для реальных турниров по мобильному киберспорту.

## Что теперь внутри

- Next.js App Router + Server Actions
- Локальный fallback-режим с пустым стартом
- Поддержка Supabase как основного backend
- Supabase Auth для регистрации и входа
- Турниры, команды, заявки, сетка и результаты матчей
- Пустой старт без демо-данных

## Локальный запуск без Supabase

```bash
npm install
npm run dev
```

Сайт запустится на локальном JSON-хранилище из `data/store.json`.
После первого запуска база будет пустой.

## Подключение Supabase

1. Создайте проект Supabase.
2. Выполните SQL из `supabase/schema.sql`.
3. Скопируйте `.env.example` в `.env.local`.
4. Заполните:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

После этого приложение автоматически переключится на Supabase.
Если таблицы пустые, сайт создаст только каталог поддерживаемых игр без тестовых пользователей, команд и турниров.

Первый зарегистрированный пользователь получает роль организатора.

## Проверка

```bash
npm run lint
npm run build
```
