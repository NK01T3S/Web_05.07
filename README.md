# Доска объявлений

Учебный проект: classified ads board.

## Стек

- **Frontend:** React 18 (Vite), React Router v6, Axios, CSS
- **Backend:** Node.js + Express
- **БД:** PostgreSQL (чистый SQL через `pg`, без ORM)
- **Аутентификация:** JWT (access-токен, 7 дней) + bcrypt

## Структура

```
ads-board/
├── server/   # backend (Express + PostgreSQL)
└── client/   # frontend (React + Vite)
```

## Как запустить

### 1. База данных

1. Установить PostgreSQL.
2. Создать БД `ads_board`.
3. Выполнить `server/sql/schema.sql`.

### 2. Backend

```bash
cd server
npm install
npm run dev
```

Сервер поднимется на `http://localhost:5000`.

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Открыть `http://localhost:5173`.

## Переменные окружения

Скопируй `server/.env.example` в `server/.env` и заполни:

- `DATABASE_URL` — строка подключения к PostgreSQL
- `JWT_SECRET` — случайная строка
- `PORT` — порт сервера (по умолчанию 5000)