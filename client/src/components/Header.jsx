import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { api, egp } from '../api.js';
import { Bag, Heart, User, Pin, Globe, Search, Menu, Close } from './Icons.jsx';
import { productName, t } from '../i18n.js';

export const NAV = [
  { slug: 'sale', label: 'تخفيضات الجمعة الذهبية', to: '/shop?sale=1', gold: true },
  { slug: 'diamond', label: 'ألماس' }, { slug: 'gold', label: 'ذهب' },
  { slug: 'contemporary', label: 'مجوهرات عصرية' },
  { slug: 'wedding', label: 'زفاف وخطوبة' }, { slug: 'gifts', label: 'هدايا ومناسبات' },
  { slug: null, label: 'تسوّقوا كلّ المجوهرات', to: '/shop' },
];
export const navTo = (n) => n.to || `/c/${n.slug}`;

function SearchBox() {
  const { language } = useStore();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const term = q.trim();

  useEffect(() => {
    let current = true;
    if (term.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setError('');
      setActiveIndex(-1);
      return () => { current = false; };
    }

    setLoading(true);
    setError('');
    const timer = setTimeout(() => {
      api(`/products?q=${encodeURIComponent(term)}&limit=5`)
        .then(products => { if (current) setSuggestions(products); })
        .catch(ex => { if (current) setError(ex.message); })
        .finally(() => { if (current) setLoading(false); });
    }, 220);

    return () => { current = false; clearTimeout(timer); };
  }, [term]);

  const search = () => {
    if (!term) return;
    setOpen(false);
    nav(`/shop?q=${encodeURIComponent(term)}`);
  };
  const openProduct = (id) => {
    setOpen(false);
    nav(`/p/${id}`);
  };
  const onKeyDown = (event) => {
    if (event.key === 'Escape') { setOpen(false); setActiveIndex(-1); }
    if (event.key === 'ArrowDown' && suggestions.length) {
      event.preventDefault();
      setActiveIndex(index => (index + 1) % suggestions.length);
    }
    if (event.key === 'ArrowUp' && suggestions.length) {
      event.preventDefault();
      setActiveIndex(index => (index <= 0 ? suggestions.length - 1 : index - 1));
    }
    if (event.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault();
      openProduct(suggestions[activeIndex].id);
    }
  };

  return (
    <div className="search-wrap" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <form className="search" role="search" onSubmit={event => { event.preventDefault(); search(); }}>
        <input
          value={q}
          onChange={event => { setQ(event.target.value); setOpen(true); setActiveIndex(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t('ابحث عن المنتجات', language)}
          aria-label={t('ابحث عن المنتجات', language)}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && term.length >= 2}
          aria-controls="search-suggestions"
          aria-activedescendant={activeIndex >= 0 ? `search-option-${activeIndex}` : undefined}
          autoComplete="off"
        />
        {q && <button type="button" className="search-clear" aria-label={t('مسح البحث', language)} onClick={() => { setQ(''); setSuggestions([]); setOpen(false); }}><Close /></button>}
        <button type="submit" aria-label={t('بحث', language)}><Search /></button>
      </form>
      {open && term.length >= 2 && (
        <div className="search-suggestions" id="search-suggestions" role="listbox" aria-label={language === 'ar' ? 'اقتراحات البحث' : 'Search suggestions'}>
          {loading && <p className="search-message">{t('جارٍ البحث…', language)}</p>}
          {!loading && error && <p className="search-message error">{t(error, language)}</p>}
          {!loading && !error && suggestions.length === 0 && <p className="search-message">{t('لا توجد نتائج مطابقة.', language)}</p>}
          {!loading && suggestions.map((product, index) => (
            <button
              type="button"
              role="option"
              aria-selected={activeIndex === index}
              id={`search-option-${index}`}
              className={`search-suggestion${activeIndex === index ? ' active' : ''}`}
              key={product.id}
              onClick={() => openProduct(product.id)}
            >
              <img src={product.images[0]} alt="" />
              <span className="search-suggestion-name">{productName(product, language)}</span>
              <span className="search-suggestion-price">{egp(product.final_price)}</span>
            </button>
          ))}
          {!loading && !error && suggestions.length > 0 && (
            <button type="button" className="search-all" onClick={search}>
              {language === 'ar' ? `عرض كل النتائج لـ «${term}»` : `View all results for “${term}”`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { user, setDrawer, cartCount, wish, language, toggleLanguage } = useStore();
  const nav = useNavigate();
  const categories = NAV.map(item => ({ ...item, label: t(item.label, language) }));
  return (
    <header className="header">
      <div className="topbar">
        <div className="wrap topbar-in">
          <span className="brand-switch">{t('لافينا', language)}</span>
          <div className="icons">
            <button onClick={() => setDrawer('cart')} aria-label={t('السلة', language)}><Bag />{cartCount > 0 && <i className="badge">{cartCount}</i>}</button>
            <button onClick={() => nav(user ? '/shop?wish=1' : '/account')} aria-label={t('الأمنيات', language)}><Heart />{wish.length > 0 && <i className="badge">{wish.length}</i>}</button>
            <button onClick={() => nav('/account')} aria-label={t('حسابي', language)}><User /></button>
            {user?.role === 'admin' && <Link className="admin-header-link" to="/admin">{language === 'ar' ? 'لوحة الأدمن' : 'Admin'}</Link>}
            <button onClick={toggleLanguage} aria-label={language === 'ar' ? 'Switch to English' : 'Switch to Arabic'} title={language === 'ar' ? 'English' : 'العربية'}><Globe /></button>
            <button aria-label={t('موقع المتجر', language)} onClick={() => document.getElementById('stores')?.scrollIntoView({ behavior: 'smooth' })}><Pin /></button>
          </div>
        </div>
      </div>

      <div className="wrap mainbar">
        <button className="hamburger" onClick={() => setDrawer('menu')} aria-label={t('القائمة', language)}><Menu /></button>
        <Link to="/" className="logo" aria-label={t('لافينا', language)}><span>L</span>AVINA</Link>
        <div className="mobile-icons">
          <button onClick={() => setDrawer('cart')} aria-label={t('السلة', language)}><Bag />{cartCount > 0 && <i className="badge">{cartCount}</i>}</button>
          <button onClick={() => nav(user ? '/shop?wish=1' : '/account')} aria-label={t('الأمنيات', language)}><Heart /></button>
          <button onClick={() => nav('/account')} aria-label={t('حسابي', language)}><User /></button>
          {user?.role === 'admin' && <Link className="admin-header-link" to="/admin">{language === 'ar' ? 'لوحة الأدمن' : 'Admin'}</Link>}
          <button onClick={toggleLanguage} aria-label={language === 'ar' ? 'Switch to English' : 'Switch to Arabic'} title={language === 'ar' ? 'English' : 'العربية'}><Globe /></button>
        </div>
        <SearchBox />
      </div>

      <nav className="desk-nav" aria-label={t('التصنيفات', language)}>
        <ul className="wrap">
          {categories.map(n => <li key={n.label}><Link to={navTo(n)} className={n.gold ? 'gold' : ''}>{n.label}</Link></li>)}
        </ul>
      </nav>
    </header>
  );
}
