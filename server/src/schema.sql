-- Lavina schema (SQLite now; types map directly to MySQL later)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT,                       -- السيد / السيدة
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  birth_date    TEXT,
  phone         TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  wedding_date  TEXT,                       -- اختياري
  newsletter    INTEGER NOT NULL DEFAULT 1,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS addresses (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      TEXT,
  governorate TEXT NOT NULL,
  city       TEXT NOT NULL,
  street     TEXT NOT NULL,
  phone      TEXT,
  is_default INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  slug      TEXT NOT NULL UNIQUE,
  name_ar   TEXT NOT NULL,
  name_en   TEXT NOT NULL,
  tagline_ar TEXT,
  image     TEXT,
  sort      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  sku              TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,           -- اسم المنتج (عربي)
  name_en          TEXT,
  description      TEXT NOT NULL,
  category_id      INTEGER NOT NULL REFERENCES categories(id),
  item_type        TEXT NOT NULL CHECK (item_type IN ('ring','necklace','bracelet','earring','set','other')),
  karat            INTEGER,                 -- 18 / 21 / 24 (أو NULL للفضة)
  weight_g         REAL,
  price            REAL NOT NULL,           -- EGP
  discount_percent INTEGER NOT NULL DEFAULT 0,
  stock            INTEGER NOT NULL DEFAULT 0,
  images           TEXT NOT NULL DEFAULT '[]',  -- JSON array
  is_best_seller   INTEGER NOT NULL DEFAULT 0,
  is_new           INTEGER NOT NULL DEFAULT 0,
  is_active        INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

CREATE TABLE IF NOT EXISTS reviews (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_approved INTEGER NOT NULL DEFAULT 1,
  UNIQUE (product_id, user_id)
);

CREATE TABLE IF NOT EXISTS wishlist (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id),
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled','returned')),
  payment_method TEXT NOT NULL DEFAULT 'cod',
  subtotal       REAL NOT NULL,
  shipping       REAL NOT NULL DEFAULT 0,     -- الشحن مجاني
  total          REAL NOT NULL,
  ship_governorate TEXT, ship_city TEXT, ship_street TEXT, ship_phone TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  name       TEXT NOT NULL,                   -- snapshot وقت الشراء
  unit_price REAL NOT NULL,
  quantity   INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE TABLE IF NOT EXISTS stores (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  address       TEXT NOT NULL,
  phone         TEXT,
  image         TEXT,
  images        TEXT NOT NULL DEFAULT '[]',
  location_url  TEXT,
  opening_hours TEXT NOT NULL DEFAULT '{}'
);
