const categories = [
  { id: 1, slug: 'diamond', name_ar: 'ألماس', name_en: 'Diamond', tagline_ar: 'مجوهرات ماسية لإطلالة تشع بالبريق', sort: 0, image: '/images/collections/diamond.jpg' },
  { id: 2, slug: 'gold', name_ar: 'ذهب', name_en: 'Gold', tagline_ar: 'سرّ التألق مع مجموعة الذهب', sort: 1, image: '/images/collections/gold.jpg' },
  { id: 3, slug: 'contemporary', name_ar: 'مجوهرات عصرية', name_en: 'Contemporary', tagline_ar: 'تصاميم حديثة بروح الموضة', sort: 2, image: '/images/collections/contemporary.jpg' },
  { id: 4, slug: 'silver-925', name_ar: 'ويفز - فضة 925', name_en: 'Silver 925', tagline_ar: 'للتألّق عنوان مع مجموعة فضة', sort: 3, image: '/images/collections/silver.jpg' },
  { id: 5, slug: 'wedding', name_ar: 'زفاف وخطوبة', name_en: 'Wedding & Engagement', tagline_ar: 'دبل وخواتم لأجمل لحظات العمر', sort: 4, image: '/images/collections/wedding.jpg' },
  { id: 6, slug: 'gifts', name_ar: 'هدايا ومناسبات', name_en: 'Gifts & Occasions', tagline_ar: 'هدية تُقال بها كل المشاعر', sort: 5, image: '/images/collections/gifts.jpg' },
];

const productRows = [
  ['LV-D-0001', 'أقراط ألماس صغيرة شكل دائري ذهب عيار 18 قيراط', 'Small Round Diamond Stud Earrings in 18K Gold', 'earring', 1, 18, 2.4, 15620, 0, 12, 1, 0, 'gemstone-earrings.jpg'],
  ['LV-D-0002', 'سلسلة ألماس شكل قطرة ذهب عيار 18 قيراط', 'Teardrop Diamond Necklace in 18K Gold', 'necklace', 1, 18, 3.1, 23980, 0, 8, 1, 1, 'gold-pendant.jpg'],
  ['LV-D-0003', 'خاتم ألماس شكل زهرة ذهب عيار 18 قيراط', 'Floral Diamond Ring in 18K Gold', 'ring', 1, 18, 3.8, 82445, 40, 5, 1, 0, 'diamond-ring.jpg'],
  ['LV-D-0004', 'خاتم ألماس إيترنتي شكل رفيع ذهب عيار 18 قيراط', 'Slim Eternity Diamond Ring in 18K Gold', 'ring', 1, 18, 2.2, 32395, 25, 9, 1, 0, 'diamond-ring.jpg'],
  ['LV-D-0005', 'خاتم ألماس شكل زهرة ذهب عيار 18 قيراط', 'Floral Diamond Ring in 18K Gold', 'ring', 1, 18, 3, 16060, 0, 7, 1, 1, 'diamond-ring.jpg'],
  ['LV-G-0001', 'أقراط ذهب بتصميم شرابة عيار 21 قيراط', 'Tassel Earrings in 21K Gold', 'earring', 2, 21, 4.5, 14200, 0, 15, 0, 1, 'gold-hoop-earrings.jpg'],
  ['LV-G-0002', 'إسورة ذهب نجوم عيار 18 قيراط', 'Star Bracelet in 18K Gold', 'bracelet', 2, 18, 5.2, 18900, 10, 10, 0, 1, 'diamond-bracelet.jpg'],
  ['LV-G-0003', 'سلسلة ذهب مع دلاية عيار 21 قيراط', 'Pendant Necklace in 21K Gold', 'necklace', 2, 21, 6, 21500, 0, 6, 0, 0, 'gold-pendant.jpg'],
  ['LV-S-0002', 'خاتم فضة 925 مرصع بزركون', '925 Silver Ring with Zircon', 'ring', 4, null, 3.5, 980, 0, 40, 0, 0, 'diamond-ring.jpg'],
  ['LV-W-0001', 'دبلة زفاف ذهب عيار 18 قيراط', '18K Gold Wedding Band', 'ring', 5, 18, 4, 17800, 0, 20, 0, 0, 'diamond-ring.jpg'],
  ['LV-C-0001', 'إسورة عصرية بحجر ملون ذهب عيار 18 قيراط', 'Modern 18K Gold Bracelet with a Colorful Stone', 'bracelet', 3, 18, 3.3, 12400, 0, 11, 0, 1, 'chain-bracelet.jpg'],
  ['LV-GF-0001', 'قلادة لؤلؤية أنيقة لهدايا المناسبات', 'Elegant Pearl Pendant Necklace for Special Occasions', 'necklace', 6, null, 2.8, 12900, 0, 8, 0, 1, 'pearl-pendant-necklace.jpg'],
];

const products = productRows.map(([
  sku, name, name_en, item_type, category_id, karat, weight_g, price, discount_percent,
  stock, is_best_seller, is_new, image,
], index) => {
  const category = categories.find(item => item.id === category_id);
  return {
    id: index + 1,
    sku,
    name,
    name_en,
    description: `تصميم أنيق من مجموعة لافينا للمجوهرات. الوزن التقريبي ${weight_g ?? '—'} جرام.`,
    description_en: `An elegant design from the Lavina Jewelry collection. Approximate weight: ${weight_g ?? '—'} g.`,
    category_id,
    category_slug: category.slug,
    category_name: category.name_ar,
    category_name_en: category.name_en,
    item_type,
    karat,
    weight_g,
    price,
    discount_percent,
    final_price: Math.round(price * (100 - discount_percent)) / 100,
    stock,
    images: [`/images/products/${image}`],
    is_best_seller,
    is_new,
    rating_avg: 0,
    rating_count: 0,
  };
});

const stores = [{
  id: 1,
  name: 'لافينا للمجوهرات',
  address: 'تفاصيل الفرع تُحدّث قريبًا',
  phone: '',
  image: '/images/collections/lavina-store-interior.webp',
  images: ['/images/collections/lavina-store-interior.webp'],
  location_url: '',
  opening_hours: {},
}];

const normalize = value => String(value)
  .toLocaleLowerCase()
  .normalize('NFD')
  .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[أإآ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ة/g, 'ه')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim();

export function getDemoResponse(path) {
  const [pathname, query = ''] = path.split('?');
  const params = new URLSearchParams(query);

  if (pathname === '/categories') return categories;
  if (pathname === '/stores') return stores;
  if (pathname === '/products') {
    let result = [...products];
    const category = params.get('category');
    const type = params.get('type');
    const search = normalize(params.get('q') || '');
    if (category) result = result.filter(product => product.category_slug === category);
    if (type) result = result.filter(product => product.item_type === type);
    if (params.has('best')) result = result.filter(product => product.is_best_seller);
    if (params.has('isNew')) result = result.filter(product => product.is_new);
    if (params.has('sale')) result = result.filter(product => product.discount_percent > 0);
    if (search) {
      const terms = search.split(/\s+/);
      result = result.map(product => {
        const categoryName = product.category_name;
        const searchable = normalize([
          product.name, product.name_en, product.sku, categoryName, product.category_name_en,
        ].join(' '));
        return { product, matchedTerms: terms.filter(term => searchable.includes(term)).length };
      }).filter(match => match.matchedTerms > 0)
        .sort((left, right) => right.matchedTerms - left.matchedTerms)
        .map(match => match.product);
    }

    const sort = params.get('sort');
    if (sort === 'price_asc') result.sort((left, right) => left.price - right.price);
    if (sort === 'price_desc') result.sort((left, right) => right.price - left.price);
    if (sort === 'newest') result.sort((left, right) => right.id - left.id);
    const limit = Math.max(1, Math.min(Number(params.get('limit')) || 40, 100));
    return result.slice(0, limit);
  }

  const productRoute = pathname.match(/^\/products\/([^/]+)(?:\/(reviews))?$/);
  if (productRoute) {
    const [, id, subresource] = productRoute;
    if (subresource === 'reviews') return [];
    return products.find(product => String(product.id) === id) || null;
  }

  return undefined;
}

export const isDemoCatalogPath = path => {
  const pathname = path.split('?')[0];
  if (pathname === '/categories' || pathname === '/products' || pathname === '/stores') return true;
  return /^\/products\/[^/]+(?:\/reviews)?$/.test(pathname);
};
