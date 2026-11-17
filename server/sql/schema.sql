-- server/sql/schema.sql
-- Схема БД для «Доски объявлений». Можно выполнять повторно (IF NOT EXISTS / ON CONFLICT).

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'user'
                CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS ads (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT         NOT NULL,
  price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  city        VARCHAR(100) NOT NULL,
  image_url   TEXT,
  status      VARCHAR(20)  NOT NULL DEFAULT 'active'
              CHECK (status IN ('active','sold')),
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  user_id     INTEGER NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  views       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ads_category   ON ads(category_id);
CREATE INDEX IF NOT EXISTS idx_ads_user       ON ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ads_price      ON ads(price);

INSERT INTO categories (name, slug) VALUES
  ('Транспорт','transport'),
  ('Недвижимость','realestate'),
  ('Электроника','electronics'),
  ('Работа','work'),
  ('Услуги','services'),
  ('Личные вещи','personal')
ON CONFLICT (slug) DO NOTHING;