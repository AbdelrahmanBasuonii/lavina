import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useStore } from '../store.jsx';
import { t } from '../i18n.js';

const COLS = [
  ['علاماتنا التجارية', ['لافينا']],
  ['عالم لافينا', ['علاقات المستثمرين', 'الشروط والسياسات', 'سياسة الإرجاع والاسترداد']],
  ['خدمة العملاء', ['اتصلوا بنا', 'الأسئلة الشائعة', 'مواقع المتجر']],
  ['نصائح الشراء', ['دليل شراء الألماس', 'دليل التسوق لهدايا عيد الحب', 'دليل هدايا رمضان', 'دليل هدايا عيد الأم', 'دليل هدايا أعياد الميلاد', 'دليل هدايا ذكرى الزفاف']],
];

export default function Footer() {
  const { user, language } = useStore();
  const [stores, setStores] = useState([]);
  useEffect(() => { api('/stores').then(setStores).catch(() => {}); }, []);
  return (
    <>
      <section className="perks wrap">
        <div><span className="dot">🚚</span><p>{t('توصيل مجاني لجميع الطلبات', language)}</p></div>
        <div><span className="dot">↻</span><p>{t('ارجاع لمدة 30 يوم مجاني', language)}</p></div>
        <div><span className="dot">⏱</span><p>{t('التوصيل مجاني في اليوم التالي داخل القاهرة (*تطبق الشروط والأحكام)', language)}</p></div>
      </section>

      <section id="stores" className="wrap section">
        <h2>{t('زورونا في فروعنا', language)}</h2>
        <div className="stores">
          {stores.map(s => (
            <article key={s.id}>
              <div className="store-img">{(s.images?.length ? s.images : (s.image ? [s.image] : ['/images/collections/lavina-store-interior.webp'])).map((src, index) => <img key={src} src={src} alt={`${t(s.name, language)} ${index + 1}`} />)}</div>
              <h3>{t(s.name, language)}</h3><p>{t(s.address, language)}</p>
              {s.phone && <a href={`tel:${s.phone}`}>{s.phone}</a>}
              {s.opening_hours && Object.entries(s.opening_hours).filter(([, hours]) => hours).length > 0 && (
                <ul className="store-hours">
                  {Object.entries(s.opening_hours).filter(([, hours]) => hours).map(([day, hours]) => (
                    <li key={day}><span>{t(({ saturday: 'السبت', sunday: 'الأحد', monday: 'الإثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة' })[day] || day, language)}</span><span dir="ltr">{hours}</span></li>
                  ))}
                </ul>
              )}
              {s.location_url && <a className="btn dark" href={s.location_url} target="_blank" rel="noreferrer">{t('موقع المتجر', language)}</a>}
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div className="wrap footer-in">
          <div className="cols">
            {COLS.map(([h, items]) => (
              <div key={h}><h4>{t(h, language)}</h4><ul>{items.map(i => <li key={i}><a href="#">{t(i, language)}</a></li>)}</ul></div>
            ))}
          </div>
          <div className="signup">
            <h3>{t('سجّلوا الآن', language)}</h3>
            <p>{t('اشتركوا للحصول على إشعارات بشأن أحدث المنتجات والعروض والخصومات', language)}</p>
            <Link className="btn white" to="/account">{t(user ? 'حسابي' : 'تسجيل الدخول', language)}</Link>
            {user?.role === 'admin' && <Link className="btn white" to="/admin">{language === 'ar' ? 'لوحة تحكم الأدمن' : 'Admin dashboard'}</Link>}
          </div>
        </div>
        <div className="wrap social">
          <small>{language === 'ar' ? 'تابعونا على' : 'Follow us'}</small>
          <div className="aoa-logo" role="img" aria-label="AOA">
            <span className="aoa-emblem" aria-hidden="true">A</span>
            <span className="aoa-wordmark">AOA</span>
          </div>
        </div>
      </footer>
    </>
  );
}
