import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import ProductRow from '../components/ProductRow.jsx';
import { useStore } from '../store.jsx';
import { categoryName, t } from '../i18n.js';
import { Chevron } from '../components/Icons.jsx';

const TYPES = ['necklace', 'ring', 'bracelet', 'earring'];
const TYPE_IMAGES = {
  necklace: '/images/collections/gold.jpg',
  ring: '/images/collections/wedding.jpg',
  bracelet: '/images/products/diamond-bracelet.jpg',
  earring: '/images/products/gold-hoop-earrings.jpg',
};

export default function Home() {
  const { language } = useStore();
  const [cats, setCats] = useState([]);
  const [fresh, setFresh] = useState([]);
  const [best, setBest] = useState([]);
  const [activeCategory, setActiveCategory] = useState(0);
  const collectionsRef = useRef(null);
  const [categoryStep, setCategoryStep] = useState(0);
  const visibleCategories = cats.filter(c => c.slug !== 'silver-925');

  useEffect(() => {
    const track = collectionsRef.current;
    const measure = () => {
      const card = track?.firstElementChild;
      if (!track || !card) return;
      const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
      setCategoryStep(card.getBoundingClientRect().width + gap);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [visibleCategories.length]);

  useEffect(() => {
    api('/categories').then(setCats).catch(() => {});
    api('/products?isNew=1').then(setFresh).catch(() => {});
    api('/products?best=1').then(setBest).catch(() => {});
  }, []);

  useEffect(() => {
    if (visibleCategories.length < 2
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setActiveCategory(index => {
        const next = (index + 1) % visibleCategories.length;
        return next;
      });
    }, 4500);
    return () => window.clearInterval(timer);
  }, [visibleCategories.length]);

  const moveCategory = (index) => {
    const next = (index + visibleCategories.length) % visibleCategories.length;
    setActiveCategory(next);
  };

  return (
    <>
      <section className="hero" style={{ backgroundImage: "linear-gradient(90deg, rgba(48, 37, 27, .3), rgba(48, 37, 27, .74)), url('/images/collections/store-banner.jpg')" }}>
        <div className="hero-copy">
          <p className="hero-brand">{t('لافينا', language)}</p>
          <h1>{t('مجموعة الألماس الحصرية', language)}</h1>
          <Link className="btn white" to="/c/diamond">{t('تسوّقوا المجموعة', language)}</Link>
        </div>
      </section>

      <ProductRow title={t('وصل حديثًا', language)} products={fresh} />

      <section className="wrap section">
        <div className="collection-carousel">
          <div className="collection-carousel-head">
            <h2>{t('تسوّقوا المجموعات', language)}</h2>
            <div className="arrows">
              <button onClick={() => moveCategory(activeCategory - 1)} aria-label={t('السابق', language)}>
                <Chevron dir={language === 'ar' ? 'right' : 'left'} />
              </button>
              <button onClick={() => moveCategory(activeCategory + 1)} aria-label={t('التالي', language)}>
                <Chevron dir={language === 'ar' ? 'left' : 'right'} />
              </button>
            </div>
          </div>
          <div className="collection-viewport">
          <div className="collections" ref={collectionsRef} style={{ transform: `translateX(-${activeCategory * categoryStep}px)` }}>
          {visibleCategories.map(c => (
            <Link key={c.id} to={`/c/${c.slug}`} className="collection" style={{ '--collection-image': c.image ? `url("${c.image}")` : 'none', direction: language }}>
              <h3>{categoryName(c, language)}</h3>
              <p>{t(c.tagline_ar, language)}</p>
              <span className="btn dark">{t('تسوّقوا المجموعات', language)}</span>
            </Link>
          ))}
          </div>
          </div>
          <div className="collection-dots" role="group" aria-label={t('التصنيفات', language)}>
            {visibleCategories.map((category, index) => (
              <button key={category.id} className={index === activeCategory ? 'active' : ''}
                aria-label={categoryName(category, language)} aria-current={index === activeCategory ? 'true' : undefined}
                onClick={() => moveCategory(index)} />
            ))}
          </div>
        </div>
      </section>

      <ProductRow title={t('الأكثر مبيعًا', language)} products={best} />

      <section className="wrap section">
        <h2>{t('تسوقوا حسب الفئة', language)}</h2>
        <div className="types">
          {TYPES.map(type => (
            <Link key={type} to={`/shop?type=${type}`} className="type">
              <div className="type-img" style={{ backgroundImage: `url("${TYPE_IMAGES[type]}")` }} />
              <span>{t(({ necklace: 'سلاسل، عقود وقلادات', ring: 'خواتم', bracelet: 'أساور وخلاخيل', earring: 'أقراط' })[type], language)}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
