# Heating Admin Web

Веб-админка для существующего backend проекта на NestJS.

## Что уже есть

- вход по `/auth/login`
- проверка роли ADMIN через `/users/me`
- дашборд `/admin/dashboard`
- пользователи `/admin/users`
- заявки `/admin/seal-requests` и `/admin/meter-replacements`
- оплаты `/admin/payments`
- объявления `/admin/announcements`
- массовые уведомления `/admin/notifications/broadcast`
- профиль администратора `/users/me`

## Запуск

1. Установить зависимости

```bash
npm install
```

2. Создать `.env` на основе `.env.example`

```env
VITE_API_BASE_URL=http://127.0.0.1:3000/api
```

3. Запустить

```bash
npm run dev
```

## Что стоит добавить следующим этапом

- CRUD по счётчикам из вебки
- просмотр истории показаний
- поиск и фильтры по таблицам
- создание/редактирование пользователей
- журнал действий администратора
- ручное создание начислений
- отдельная страница уведомлений конкретному пользователю
- роли и granular permissions
