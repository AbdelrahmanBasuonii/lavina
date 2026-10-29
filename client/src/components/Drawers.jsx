import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { NAV, navTo } from './Header.jsx';
import { Close, Chevron, Headset, User, Pin, Globe } from './Icons.jsx';
import { egp } from '../api.js';
import AccountDetails from './AccountDetails.jsx';
import { productName, t } from '../i18n.js';

export default function Drawers() {
  const { drawer, setDrawer, cart, setQty, cartTotal, user, logout, language, toggleLanguage } = useStore();
  const nav = useNavigate();
  const close = () => setDrawer(null);
  const go = (to) => { close(); nav(to); };
  if (!drawer) return null;
  return (
    <div className="overlay" onClick={close}>
      <aside className="drawer" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="x" onClick={close} aria-label={t('إغلاق', language)}><Close /></button>

        {drawer === 'menu' && (
          <>
            <div className="tabs"><b className="on">{t('لافينا', language)}</b></div>
            <ul className="menu-list">
              {NAV.map(n => (
                <li key={n.label}><button className={n.gold ? 'gold' : ''} onClick={() => go(navTo(n))}>{t(n.label, language)}<Chevron /></button></li>
              ))}
            </ul>
            <ul className="menu-list small">
              <li><button onClick={close}><Headset />{t('خدمة العملاء', language)}</button></li>
              <li><button onClick={() => go('/account')}><User />{t('حسابي', language)}</button></li>
              <li><button onClick={() => { close(); document.getElementById('stores')?.scrollIntoView({ behavior: 'smooth' }); }}><Pin />{t('موقع المتجر', language)}</button></li>
              <li><button onClick={toggleLanguage}><Globe />{language === 'ar' ? 'Egypt | English' : 'Egypt | Arabic'}</button></li>
            </ul>
            {!user && <div className="auth-btns">
              <button className="btn dark" onClick={() => go('/account?tab=register')}>{t('إنشاء حساب', language)}</button>
              <button className="btn line" onClick={() => go('/account')}>{t('تسجيل الدخول', language)}</button>
            </div>}
          </>
        )}

        {drawer === 'account' && (
          <div className="account-drawer">
            <User />
            {user ? <>
              <h3>{language === 'ar' ? `مرحبا، ${user.first_name}` : `Hello, ${user.first_name}`}</h3>
              <AccountDetails user={user} language={language} />
              <button className="btn line full" onClick={() => go('/account')}>{t('عرض حسابي', language)}</button>
              <button className="logout" onClick={() => { logout(); close(); }}>{t('تسجيل الخروج', language)}</button>
            </> : <>
              <h3>{t('أهلاً بك في لافينا', language)}</h3>
              <div className="auth-btns">
                <button className="btn dark" onClick={() => go('/account?tab=register')}>{t('إنشاء حساب', language)}</button>
                <button className="btn line" onClick={() => go('/account')}>{t('تسجيل الدخول', language)}</button>
              </div>
            </>}
          </div>
        )}

        {drawer === 'cart' && (
          <div className="cart">
            <h3>{t('سلة التسوق', language)}</h3>
            {cart.length === 0 ? <p className="empty">{t('السلة فارغة. ابدأ بإضافة قطعة تعجبك.', language)}</p> : <>
              <ul>
                {cart.map(({ product: p, quantity }) => (
                  <li key={p.id}>
                    <img src={p.images[0]} alt="" />
                    <div>
                      <Link to={`/p/${p.id}`} onClick={close}>{productName(p, language)}</Link>
                      <b>{egp(p.final_price)}</b>
                      <div className="qty">
                        <button onClick={() => setQty(p.id, quantity - 1)} aria-label={t('تقليل', language)}>−</button>
                        <span>{quantity}</span>
                        <button onClick={() => setQty(p.id, quantity + 1)} aria-label={t('زيادة', language)}>+</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="total"><span>{t('الإجمالي (التوصيل مجاني)', language)}</span><b>{egp(cartTotal)}</b></div>
              <button className="btn dark full" onClick={() => go('/checkout')}>
                {user ? t('إتمام الشراء', language) : t('سجل الدخول لإتمام الشراء', language)}
              </button>
            </>}
          </div>
        )}
      </aside>
    </div>
  );
}
