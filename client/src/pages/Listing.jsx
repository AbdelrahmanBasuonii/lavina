import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useStore } from '../store.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { categoryName, t } from '../i18n.js';

const TYPE_LABEL = { necklace: 'سلاسل وقلادات', ring: 'خواتم', bracelet: 'أساور', earring: 'أقراط' };

export default function Listing() {
  const { slug } = useParams();
  const [sp, setSp] = useSearchParams();
  const { token, language } = useStore();
  const [items, setItems] = useState(null);
  const [title, setTitle] = useState('كل المجوهرات');
  const sort = sp.get('sort') || '', type = sp.get('type') || '', q = sp.get('q') || '';
  const sale = sp.get('sale'), wish = sp.get('wish');

  useEffect(() => {
    setItems(null);
    if (slug === 'silver-925') {
      setItems([]);
      return;
    }
    if (wish) { setTitle(t('قائمة أمنياتي', language)); api('/wishlist', { token }).then(setItems).catch(() => setItems([])); return; }
    const qs = new URLSearchParams({ ...(slug && { category: slug }), ...(type && { type }), ...(q && { q }), ...(sort && { sort }), ...(sale && { sale: 1 }) });
    api('/products?' + qs).then(setItems).catch(() => setItems([]));
    if (slug) api('/categories').then(c => {
      const category = c.find(x => x.slug === slug);
      setTitle(category ? categoryName(category, language) : '');
    }).catch(() => {});
    else setTitle(q ? `${t('نتائج البحث:', language)} ${q}` : sale ? t('التخفيضات', language) : type ? t(TYPE_LABEL[type], language) : t('كل المجوهرات', language));
  }, [slug, type, q, sort, sale, wish, token, language]);

  if (slug === 'silver-925') return <p className="wrap empty">{t('الصفحة غير موجودة.', language)}</p>;

  return (
    <section className="wrap section">
      <div className="list-head">
        <h1>{title}</h1>
        <select value={sort} onChange={e => { const n = new URLSearchParams(sp); e.target.value ? n.set('sort', e.target.value) : n.delete('sort'); setSp(n); }} aria-label={t('الترتيب', language)}>
          <option value="">{t('الأكثر صلة', language)}</option><option value="newest">{t('الأحدث', language)}</option>
          <option value="price_asc">{t('السعر: الأقل أولاً', language)}</option><option value="price_desc">{t('السعر: الأعلى أولاً', language)}</option>
        </select>
      </div>
      {items === null ? <p className="empty">{t('جارٍ التحميل…', language)}</p>
        : items.length === 0 ? <p className="empty">{t('لا توجد منتجات مطابقة. جرّب تصنيفًا آخر أو كلمة بحث مختلفة.', language)}</p>
        : <div className="grid">{items.map(p => <ProductCard key={p.id} p={p} />)}</div>}
    </section>
  );
}
