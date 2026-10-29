import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
if (process.env.NODE_ENV === 'production') {
  const missingConfig = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) missingConfig.push('JWT_SECRET (at least 32 characters)');
  if (!allowedOrigins.length) missingConfig.push('CLIENT_ORIGIN');
  if (!process.env.API_PUBLIC_URL) missingConfig.push('API_PUBLIC_URL');
  if (missingConfig.length) throw new Error(`Missing production configuration: ${missingConfig.join(', ')}`);
}
const SECRET = process.env.JWT_SECRET || 'dev-secret';
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '8mb' }));
const apiPublicUrl = (process.env.API_PUBLIC_URL || '').replace(/\/+$/, '');
const uploadsDir = path.resolve(process.env.UPLOADS_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads'));
app.use('/uploads', express.static(uploadsDir));
const publicAssetUrl = value => value?.startsWith('/uploads/') && apiPublicUrl
  ? `${apiPublicUrl}${value}`
  : value;

// ---------- helpers ----------
const sign = (u) => jwt.sign({ id: u.id, role: u.role }, SECRET, { expiresIn: '7d' });
const publicUser = ({ password_hash, ...u }) => u;
const auth = (req, res, next) => {
  const h = req.headers.authorization?.split(' ')[1];
  try { req.user = jwt.verify(h, SECRET); next(); }
  catch { res.status(401).json({ error: 'سجّل الدخول للمتابعة' }); }
};
const adminOnly = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ error: 'غير مصرح' });
const validate = (schema) => (req, res, next) => {
  const r = schema.safeParse(req.body);
  if (!r.success) return res.status(400).json({ error: r.error.issues[0].message });
  req.body = r.data; next();
};
const shapeProduct = (p) => ({
  ...p,
  images: JSON.parse(p.images).map(publicAssetUrl),
  final_price: Math.round(p.price * (100 - p.discount_percent)) / 100,
});
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
// rating aggregates computed from reviews
const PRODUCT_SELECT = `
  SELECT p.*, c.slug AS category_slug, c.name_ar AS category_name, c.name_en AS category_name_en,
    COALESCE((SELECT ROUND(AVG(rating),1) FROM reviews r WHERE r.product_id=p.id AND r.is_approved=1),0) AS rating_avg,
    (SELECT COUNT(*) FROM reviews r WHERE r.product_id=p.id AND r.is_approved=1) AS rating_count
  FROM products p JOIN categories c ON c.id=p.category_id`;

const normalizeSearch = (value) => value
  .toLocaleLowerCase()
  .normalize('NFD')
  .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[أإآ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ة/g, 'ه')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim();

const editDistance = (left, right, cutoff) => {
  if (Math.abs(left.length - right.length) > cutoff) return cutoff + 1;
  let previous = Array.from({ length: right.length + 1 }, (_, i) => i);
  let beforePrevious = null;
  for (let i = 1; i <= left.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= right.length; j++) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
      if (beforePrevious && i > 1 && j > 1
        && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) {
        current[j] = Math.min(current[j], beforePrevious[j - 2] + 1);
      }
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > cutoff) return cutoff + 1;
    beforePrevious = previous;
    previous = current;
  }
  return previous[right.length];
};

const searchScore = (product, terms) => {
  const fields = [product.name, product.name_en, product.sku, product.category_name, product.category_name_en, product.description]
    .filter(Boolean)
    .map(normalizeSearch);
  const words = [...new Set(fields.flatMap(field => field.split(' ')).filter(Boolean))];
  let matchedTerms = 0;
  let score = 0;

  for (const term of terms) {
    const maxDistance = term.length >= 7 ? 2 : term.length >= 3 ? 1 : 0;
    let best = 0;
    for (const field of fields) {
      if (field === term) best = Math.max(best, 100);
      else if (field.includes(term)) best = Math.max(best, 85);
    }
    for (const word of words) {
      if (word === term) best = Math.max(best, 100);
      else if (word.includes(term) || term.includes(word)) best = Math.max(best, 78);
      else if (maxDistance) {
        const distance = editDistance(term, word, maxDistance);
        if (distance <= maxDistance) best = Math.max(best, 70 - distance * 10);
      }
    }
    if (best) {
      matchedTerms++;
      score += best;
    }
  }
  return { matchedTerms, score };
};

// ---------- auth ----------
const registerSchema = z.object({
  title: z.string().optional(),
  first_name: z.string().min(1, 'الاسم الأول مطلوب'),
  last_name: z.string().min(1, 'الاسم الأخير مطلوب'),
  birth_date: z.string().optional(),
  phone: z.string().min(8, 'رقم الهاتف غير صحيح'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور 8 أحرف على الأقل'),
  wedding_date: z.string().optional(),
  newsletter: z.boolean().optional(),
});
app.post('/api/auth/register', validate(registerSchema), (req, res) => {
  const b = req.body;
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(b.email))
    return res.status(409).json({ error: 'البريد الإلكتروني مسجّل بالفعل' });
  const info = db.prepare(`INSERT INTO users (title,first_name,last_name,birth_date,phone,email,password_hash,wedding_date,newsletter)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(b.title ?? null, b.first_name, b.last_name, b.birth_date ?? null, b.phone,
    b.email, bcrypt.hashSync(b.password, 10), b.wedding_date ?? null, b.newsletter === false ? 0 : 1);
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(info.lastInsertRowid);
  res.status(201).json({ token: sign(user), user: publicUser(user) });
});
app.post('/api/auth/login', validate(z.object({ email: z.string().email(), password: z.string() })), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(req.body.email);
  if (!user || !bcrypt.compareSync(req.body.password, user.password_hash))
    return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  res.json({ token: sign(user), user: publicUser(user) });
});
app.get('/api/me', auth, (req, res) =>
  res.json(publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id))));

// ---------- catalog ----------
app.get('/api/categories', (_req, res) =>
  res.json(db.prepare('SELECT * FROM categories ORDER BY sort').all()));

app.get('/api/products', (req, res) => {
  const { category, type, q, sort, best, isNew, sale, limit = 40 } = req.query;
  const where = ['p.is_active=1'], args = [];
  const searchTerms = typeof q === 'string' ? normalizeSearch(q).split(/\s+/).filter(Boolean) : [];
  if (category) { where.push('c.slug=?'); args.push(category); }
  if (type) { where.push('p.item_type=?'); args.push(type); }
  if (best) where.push('p.is_best_seller=1');
  if (isNew) where.push('p.is_new=1');
  if (sale) where.push('p.discount_percent>0');
  const sortOrder = { price_asc: 'p.price ASC', price_desc: 'p.price DESC', newest: 'p.created_at DESC, p.id DESC' }[sort];
  const pageSize = Math.max(1, Math.min(Number(limit) || 40, 100));
  let rows = db.prepare(`${PRODUCT_SELECT} WHERE ${where.join(' AND ')} ORDER BY ${sortOrder || 'p.id ASC'}`)
    .all(...args);
  if (searchTerms.length) {
    const exactSkuMatches = typeof q === 'string'
      ? rows.filter(product => normalizeSearch(product.sku) === normalizeSearch(q.trim()))
      : [];
    rows = exactSkuMatches.length ? exactSkuMatches : rows
      .map(product => ({ product, ...searchScore(product, searchTerms) }))
      .filter(result => result.matchedTerms > 0)
      .sort((a, b) => sortOrder
        ? 0
        : b.matchedTerms - a.matchedTerms || b.score - a.score || a.product.id - b.product.id)
      .map(result => result.product);
  }
  rows = rows.slice(0, pageSize);
  res.json(rows.map(shapeProduct));
});
app.get('/api/products/:id', (req, res) => {
  const p = db.prepare(`${PRODUCT_SELECT} WHERE p.id=?`).get(req.params.id);
  if (!p) return res.status(404).json({ error: 'المنتج غير موجود' });
  res.json(shapeProduct(p));
});

// ---------- reviews ----------
app.get('/api/products/:id/reviews', (req, res) =>
  res.json(db.prepare(`SELECT r.id,r.rating,r.comment,r.created_at,u.first_name
    FROM reviews r JOIN users u ON u.id=r.user_id
    WHERE r.product_id=? AND r.is_approved=1 ORDER BY r.id DESC`).all(req.params.id)));
app.post('/api/products/:id/reviews', auth,
  validate(z.object({ rating: z.number().int().min(1).max(5), comment: z.string().max(1000).optional() })),
  (req, res) => {
    db.prepare(`INSERT INTO reviews (product_id,user_id,rating,comment) VALUES (?,?,?,?)
      ON CONFLICT(product_id,user_id) DO UPDATE SET rating=excluded.rating, comment=excluded.comment`)
      .run(req.params.id, req.user.id, req.body.rating, req.body.comment ?? null);
    res.status(201).json({ ok: true });
  });

// ---------- wishlist ----------
app.get('/api/wishlist', auth, (req, res) =>
  res.json(db.prepare(`${PRODUCT_SELECT} JOIN wishlist w ON w.product_id=p.id WHERE w.user_id=?`)
    .all(req.user.id).map(shapeProduct)));
app.put('/api/wishlist/:productId', auth, (req, res) => {
  db.prepare('INSERT OR IGNORE INTO wishlist (user_id,product_id) VALUES (?,?)').run(req.user.id, req.params.productId);
  res.json({ ok: true });
});
app.delete('/api/wishlist/:productId', auth, (req, res) => {
  db.prepare('DELETE FROM wishlist WHERE user_id=? AND product_id=?').run(req.user.id, req.params.productId);
  res.json({ ok: true });
});

// ---------- orders (cart lives on the client; prices are re-read on the server) ----------
const orderSchema = z.object({
  items: z.array(z.object({ product_id: z.number().int(), quantity: z.number().int().min(1).max(10) })).min(1),
  governorate: z.string().trim().min(1), city: z.string().trim().min(1), street: z.string().trim().min(1), phone: z.string().trim().min(8),
  payment_method: z.enum(['fawry', 'instapay', 'cod']),
});
app.post('/api/orders', auth, validate(orderSchema), (req, res) => {
  const b = req.body;
  const tx = db.transaction(() => {
    let subtotal = 0; const lines = [];
    for (const it of b.items) {
      const p = db.prepare('SELECT * FROM products WHERE id=? AND is_active=1').get(it.product_id);
      if (!p) throw new Error('منتج غير متاح');
      if (p.stock < it.quantity) throw new Error(`الكمية المطلوبة غير متوفرة: ${p.name}`);
      const unit = Math.round(p.price * (100 - p.discount_percent)) / 100;
      subtotal += unit * it.quantity;
      lines.push({ p, unit, qty: it.quantity });
    }
    const o = db.prepare(`INSERT INTO orders (user_id,payment_method,subtotal,shipping,total,ship_governorate,ship_city,ship_street,ship_phone)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(req.user.id, b.payment_method, subtotal, 0, subtotal, b.governorate, b.city, b.street, b.phone);
    for (const l of lines) {
      db.prepare('INSERT INTO order_items (order_id,product_id,name,unit_price,quantity) VALUES (?,?,?,?,?)')
        .run(o.lastInsertRowid, l.p.id, l.p.name, l.unit, l.qty);
      db.prepare('UPDATE products SET stock=stock-? WHERE id=?').run(l.qty, l.p.id);
    }
    return { id: o.lastInsertRowid, total: subtotal };
  });
  try { res.status(201).json(tx()); } catch (e) { res.status(400).json({ error: e.message }); }
});
app.get('/api/orders', auth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC').all(req.user.id);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id=?');
  res.json(orders.map(o => ({ ...o, items: items.all(o.id) })));
});

// ---------- admin ----------
app.get('/api/admin/orders', auth, adminOnly, (_req, res) => {
  const orders = db.prepare(`SELECT o.*, u.first_name, u.last_name, u.email
    FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.id DESC`).all();
  const items = db.prepare(`SELECT oi.*, p.sku, p.karat, p.weight_g, p.images
    FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?`);
  res.json(orders.map(order => ({
    ...order,
    items: items.all(order.id).map(item => ({
      ...item,
      images: item.images ? JSON.parse(item.images).map(publicAssetUrl) : [],
    })),
  })));
});
app.patch('/api/admin/orders/:id', auth, adminOnly,
  validate(z.object({ status: z.enum(['confirmed', 'shipped', 'delivered', 'cancelled', 'returned']) })),
  (req, res) => {
    const order = db.prepare('SELECT id,status FROM orders WHERE id=?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });
    if (order.status === 'cancelled' && req.body.status !== 'cancelled')
      return res.status(409).json({ error: 'لا يمكن إعادة تفعيل طلب ملغي' });
    if (order.status === 'pending' && !['confirmed', 'cancelled'].includes(req.body.status))
      return res.status(409).json({ error: 'يجب الموافقة على الطلب أو رفضه أولًا' });
    const update = db.transaction(() => {
      if (req.body.status === 'cancelled' && order.status !== 'cancelled') {
        const lines = db.prepare('SELECT product_id,quantity FROM order_items WHERE order_id=?').all(order.id);
        const restoreStock = db.prepare('UPDATE products SET stock=stock+? WHERE id=?');
        lines.forEach(line => restoreStock.run(line.quantity, line.product_id));
      }
      db.prepare('UPDATE orders SET status=? WHERE id=?').run(req.body.status, order.id);
    });
    update();
    res.json({ ok: true });
  });

const productSchema = z.object({
  sku: z.string().min(1), name: z.string().min(1), name_en: z.string().optional(), description: z.string().min(1),
  category_id: z.number().int(), item_type: z.enum(['ring', 'necklace', 'bracelet', 'earring', 'set', 'other']),
  karat: z.number().int().nullable().optional(), weight_g: z.number().nullable().optional(),
  price: z.number().positive(), discount_percent: z.number().int().min(0).max(90).default(0),
  stock: z.number().int().min(0).default(0), images: z.array(z.string()).default([]),
  is_best_seller: z.boolean().default(false), is_new: z.boolean().default(false),
  is_active: z.boolean().default(true),
});
app.get('/api/admin/products', auth, adminOnly, (_req, res) =>
  res.json(db.prepare(`${PRODUCT_SELECT} ORDER BY p.id DESC`).all().map(shapeProduct)));
app.post('/api/admin/products', auth, adminOnly, validate(productSchema), (req, res) => {
  const b = req.body;
  const i = db.prepare(`INSERT INTO products (sku,name,name_en,description,category_id,item_type,karat,weight_g,price,discount_percent,stock,images,is_best_seller,is_new,is_active)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(b.sku, b.name, b.name_en ?? null, b.description, b.category_id, b.item_type,
    b.karat ?? null, b.weight_g ?? null, b.price, b.discount_percent, b.stock, JSON.stringify(b.images), +b.is_best_seller, +b.is_new, +b.is_active);
  res.status(201).json({ id: i.lastInsertRowid });
});
app.put('/api/admin/products/:id', auth, adminOnly, validate(productSchema), (req, res) => {
  const b = req.body;
  db.prepare(`UPDATE products SET sku=?,name=?,name_en=?,description=?,category_id=?,item_type=?,karat=?,weight_g=?,price=?,discount_percent=?,stock=?,images=?,is_best_seller=?,is_new=?,is_active=? WHERE id=?`)
    .run(b.sku, b.name, b.name_en ?? null, b.description, b.category_id, b.item_type, b.karat ?? null, b.weight_g ?? null,
      b.price, b.discount_percent, b.stock, JSON.stringify(b.images), +b.is_best_seller, +b.is_new, +b.is_active, req.params.id);
  res.json({ ok: true });
});
app.delete('/api/admin/products/:id', auth, adminOnly, (req, res) => {
  db.prepare('UPDATE products SET is_active=0 WHERE id=?').run(req.params.id); // soft delete keeps order history valid
  res.json({ ok: true });
});

app.post('/api/admin/uploads', auth, adminOnly, async (req, res) => {
  const match = typeof req.body.data === 'string'
    ? req.body.data.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/)
    : null;
  if (!match) return res.status(400).json({ error: 'صيغة الصورة غير مدعومة' });
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > 5 * 1024 * 1024)
    return res.status(400).json({ error: 'حجم الصورة يجب ألا يتجاوز 5 ميجابايت' });
  const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
  const filename = `${randomUUID()}.${extension}`;
  try {
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), buffer, { flag: 'wx' });
  } catch (error) {
    console.error('Image upload failed:', error);
    return res.status(500).json({ error: 'تعذر حفظ الصورة' });
  }
  res.status(201).json({ url: publicAssetUrl(`/uploads/${filename}`) });
});

const storeSchema = z.object({
  name: z.string().min(1), address: z.string().min(1), phone: z.string().optional(),
  location_url: z.string().url().or(z.literal('')).optional(),
  images: z.array(z.string()).default([]),
  opening_hours: z.record(z.string(), z.string()).default({}),
});
const shapeStore = store => ({
  ...store,
  images: JSON.parse(store.images || '[]').map(publicAssetUrl),
  image: publicAssetUrl(store.image),
  opening_hours: JSON.parse(store.opening_hours || '{}'),
});
app.get('/api/admin/reviews', auth, adminOnly, (_req, res) =>
  res.json(db.prepare(`SELECT r.*, u.first_name, u.last_name, p.name AS product_name, p.sku
    FROM reviews r JOIN users u ON u.id=r.user_id JOIN products p ON p.id=r.product_id
    ORDER BY r.id DESC`).all()));
app.patch('/api/admin/reviews/:id', auth, adminOnly,
  validate(z.object({ is_approved: z.boolean() })),
  (req, res) => {
    const result = db.prepare('UPDATE reviews SET is_approved=? WHERE id=?').run(+req.body.is_approved, req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'التقييم غير موجود' });
    res.json({ ok: true });
  });
app.delete('/api/admin/reviews/:id', auth, adminOnly, (req, res) => {
  const result = db.prepare('DELETE FROM reviews WHERE id=?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'التقييم غير موجود' });
  res.json({ ok: true });
});
app.get('/api/admin/stores', auth, adminOnly, (_req, res) =>
  res.json(db.prepare('SELECT * FROM stores ORDER BY id').all().map(shapeStore)));
app.post('/api/admin/stores', auth, adminOnly, validate(storeSchema), (req, res) => {
  const b = req.body;
  const result = db.prepare(`INSERT INTO stores (name,address,phone,images,image,location_url,opening_hours)
    VALUES (?,?,?,?,?,?,?)`).run(b.name, b.address, b.phone ?? '', JSON.stringify(b.images),
    b.images[0] ?? '', b.location_url ?? '', JSON.stringify(b.opening_hours));
  res.status(201).json({ id: result.lastInsertRowid });
});
app.put('/api/admin/stores/:id', auth, adminOnly, validate(storeSchema), (req, res) => {
  const b = req.body;
  const result = db.prepare(`UPDATE stores SET name=?,address=?,phone=?,images=?,image=?,location_url=?,opening_hours=?
    WHERE id=?`).run(b.name, b.address, b.phone ?? '', JSON.stringify(b.images), b.images[0] ?? '',
    b.location_url ?? '', JSON.stringify(b.opening_hours), req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'الفرع غير موجود' });
  res.json({ ok: true });
});
app.delete('/api/admin/stores/:id', auth, adminOnly, (req, res) => {
  const result = db.prepare('DELETE FROM stores WHERE id=?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'الفرع غير موجود' });
  res.json({ ok: true });
});
app.get('/api/stores', (_req, res) => res.json(db.prepare('SELECT * FROM stores').all().map(shapeStore)));

app.listen(process.env.PORT || 4000, () => console.log('Lavina API on :' + (process.env.PORT || 4000)));
