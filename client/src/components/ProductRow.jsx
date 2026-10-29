import { useRef } from 'react';
import ProductCard from './ProductCard.jsx';
import { Chevron } from './Icons.jsx';
import { useStore } from '../store.jsx';
import { t } from '../i18n.js';

export default function ProductRow({ title, products }) {
  const { language } = useStore();
  const ref = useRef(null);
  const scroll = (dir) => ref.current.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  if (!products.length) return null;
  return (
    <section className="wrap section">
      <div className="row-head">
        <h2>{title}</h2>
        <div className="arrows">
          <button onClick={() => scroll(language === 'ar' ? 1 : -1)} aria-label={t('التالي', language)}><Chevron dir={language === 'ar' ? 'left' : 'right'} /></button>
          <button onClick={() => scroll(language === 'ar' ? -1 : 1)} aria-label={t('السابق', language)}><Chevron dir={language === 'ar' ? 'right' : 'left'} /></button>
        </div>
      </div>
      <div className="scroller" ref={ref}>
        {products.map(p => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}
