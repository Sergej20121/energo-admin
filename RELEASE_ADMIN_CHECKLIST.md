# Admin release checklist

1. Заполни `.env.production` реальным `VITE_API_BASE_URL` через HTTPS.
2. Выполни `npm install`.
3. Выполни `npm run release:check`.
4. Загрузи содержимое папки `dist` на HTTPS-хостинг.
5. Укажи домен админки в `CORS_ORIGINS` backend.
