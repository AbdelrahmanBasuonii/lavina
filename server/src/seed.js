import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

const adminEmail = process.env.ADMIN_EMAIL?.trim();
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminEmail || !adminPassword || adminPassword.length < 12) {
  throw new Error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters in server/.env before seeding.');
}

db.exec(`DELETE FROM order_items; DELETE FROM orders; DELETE FROM reviews; DELETE FROM wishlist;
DELETE FROM products; DELETE FROM categories; DELETE FROM stores; DELETE FROM users;`);

const cats = [
  ['diamond', 'ألماس', 'Diamond', 'مجوهرات ماسية لإطلالة تشع بالبريق'],
  ['gold', 'ذهب', 'Gold', 'سرّ التألق مع مجموعة الذهب'],
  ['contemporary', 'مجوهرات عصرية', 'Contemporary', 'تصاميم حديثة بروح الموضة'],
  ['silver-925', 'ويفز - فضة 925', 'Silver 925', 'للتألّق عنوان مع مجموعة فضة'],
  ['wedding', 'زفاف وخطوبة', 'Wedding & Engagement', 'دبل وخواتم لأجمل لحظات العمر'],
  ['gifts', 'هدايا ومناسبات', 'Gifts & Occasions', 'هدية تُقال بها كل المشاعر'],
];
const categoryImages = {
  diamond: '/images/collections/diamond.jpg',
  gold: '/images/collections/gold.jpg',
  contemporary: '/images/collections/contemporary.jpg',
  'silver-925': '/images/collections/silver.jpg',
  wedding: '/images/collections/wedding.jpg',
  gifts: '/images/collections/gifts.jpg',
};
const insCat = db.prepare('INSERT INTO categories (slug,name_ar,name_en,tagline_ar,sort,image) VALUES (?,?,?,?,?,?)');
cats.forEach((c, i) => insCat.run(...c, i, categoryImages[c[0]]));
const catId = Object.fromEntries(db.prepare('SELECT id,slug FROM categories').all().map(r => [r.slug, r.id]));

const products = [
  // sku, name, type, cat, karat, weight, price, discount, stock, bestSeller, isNew
  ['LV-D-0001', 'أقراط ألماس صغيرة شكل دائري ذهب عيار 18 قيراط', 'earring', 'diamond', 18, 2.4, 15620, 0, 12, 1, 0],
  ['LV-D-0002', 'سلسلة ألماس شكل قطرة ذهب عيار 18 قيراط', 'necklace', 'diamond', 18, 3.1, 23980, 0, 8, 1, 1],
  ['LV-D-0003', 'خاتم ألماس شكل زهرة ذهب عيار 18 قيراط', 'ring', 'diamond', 18, 3.8, 82445, 40, 5, 1, 0],
  ['LV-D-0004', 'خاتم ألماس إيترنتي شكل رفيع ذهب عيار 18 قيراط', 'ring', 'diamond', 18, 2.2, 32395, 25, 9, 1, 0],
  ['LV-D-0005', 'خاتم ألماس شكل زهرة ذهب عيار 18 قيراط', 'ring', 'diamond', 18, 3.0, 16060, 0, 7, 1, 1],
  ['LV-G-0001', 'أقراط ذهب بتصميم شرابة عيار 21 قيراط', 'earring', 'gold', 21, 4.5, 14200, 0, 15, 0, 1],
  ['LV-G-0002', 'إسورة ذهب نجوم عيار 18 قيراط', 'bracelet', 'gold', 18, 5.2, 18900, 10, 10, 0, 1],
  ['LV-G-0003', 'سلسلة ذهب مع دلاية عيار 21 قيراط', 'necklace', 'gold', 21, 6.0, 21500, 0, 6, 0, 0],
  ['LV-S-0002', 'خاتم فضة 925 مرصع بزركون', 'ring', 'silver-925', null, 3.5, 980, 0, 40, 0, 0],
  ['LV-W-0001', 'دبلة زفاف ذهب عيار 18 قيراط', 'ring', 'wedding', 18, 4.0, 17800, 0, 20, 0, 0],
  ['LV-C-0001', 'إسورة عصرية بحجر ملون ذهب عيار 18 قيراط', 'bracelet', 'contemporary', 18, 3.3, 12400, 0, 11, 0, 1],
];
const productNamesEn = {
  'LV-D-0001': 'Small Round Diamond Stud Earrings in 18K Gold',
  'LV-D-0002': 'Teardrop Diamond Necklace in 18K Gold',
  'LV-D-0003': 'Floral Diamond Ring in 18K Gold',
  'LV-D-0004': 'Slim Eternity Diamond Ring in 18K Gold',
  'LV-D-0005': 'Floral Diamond Ring in 18K Gold',
  'LV-G-0001': 'Tassel Earrings in 21K Gold',
  'LV-G-0002': 'Star Bracelet in 18K Gold',
  'LV-G-0003': 'Pendant Necklace in 21K Gold',
  'LV-S-0002': '925 Silver Ring with Zircon',
  'LV-W-0001': '18K Gold Wedding Band',
  'LV-C-0001': 'Modern 18K Gold Bracelet with a Colorful Stone',
};
const productImages = {
  'LV-D-0001': '/images/products/gemstone-earrings.jpg',
  'LV-D-0002': '/images/products/gold-pendant.jpg',
  'LV-D-0003': '/images/products/diamond-ring.jpg',
  'LV-D-0004': '/images/products/diamond-ring.jpg',
  'LV-D-0005': '/images/products/diamond-ring.jpg',
  'LV-G-0001': '/images/products/gold-hoop-earrings.jpg',
  'LV-G-0002': '/images/products/diamond-bracelet.jpg',
  'LV-G-0003': '/images/products/gold-pendant.jpg',
  'LV-S-0002': '/images/products/diamond-ring.jpg',
  'LV-W-0001': '/images/products/diamond-ring.jpg',
  'LV-C-0001': '/images/products/chain-bracelet.jpg',
};
const insP = db.prepare(`INSERT INTO products
 (sku,name,name_en,description,category_id,item_type,karat,weight_g,price,discount_percent,stock,images,is_best_seller,is_new)
 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
for (const [sku, name, type, cat, karat, w, price, disc, stock, best, isNew] of products) {
  insP.run(sku, name, productNamesEn[sku], `${name}. صناعة متقنة من لافينا للمجوهرات مع شهادة ضمان وفاتورة رسمية. الوزن التقريبي ${w} جرام.`,
    catId[cat], type, karat, w, price, disc, stock, JSON.stringify([productImages[sku]]), best, isNew);
}

db.prepare('INSERT INTO stores (name,address,phone) VALUES (?,?,?)')
  .run('لافينا - الفرع الرئيسي', 'العنوان هنا', '0000000000');

db.prepare(`INSERT INTO users (title,first_name,last_name,phone,email,password_hash,role) VALUES (?,?,?,?,?,?,?)`)
  .run('السيد', 'Admin', 'Lavina', '+200000000000', adminEmail, bcrypt.hashSync(adminPassword, 10), 'admin');

console.log('Seeded:', db.prepare('SELECT COUNT(*) c FROM products').get().c, 'products');
