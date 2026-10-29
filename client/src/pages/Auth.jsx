import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api, egp } from '../api.js';
import { useStore } from '../store.jsx';
import AccountDetails from '../components/AccountDetails.jsx';
import { t } from '../i18n.js';

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export default function Auth() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const tab = params.get('tab') === 'register' ? 'register' : 'login';
  const { login, user, logout, language, token } = useStore();
  const nav = useNavigate();
  const [f, setF] = useState({ title: 'السيد', newsletter: true });
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  useEffect(() => {
    if (!user || !token) return;
    let active = true;
    api('/orders', { token })
      .then(rows => { if (active) setOrders(rows); })
      .catch(ex => { if (active) setOrdersError(ex.message); });
    return () => { active = false; };
  }, [token, user]);

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (tab === 'register' && f.password !== confirm) return setErr(t('كلمتا المرور غير متطابقتين', language));
    setBusy(true);
    try {
      const body = tab === 'login' ? { email: f.email, password: f.password } : { ...f, phone: '+20' + String(f.phone || '').replace(/^0/, '') };
      const { token, user } = await api(`/auth/${tab}`, { method: 'POST', body });
      login(token, user); nav(location.state?.from || '/');
    } catch (ex) { setErr(t(ex.message, language)); } finally { setBusy(false); }
  };

  if (user) {
    return (
      <section className="auth account-page">
        <div className="account-page-head">
          <span className="account-avatar"><UserIcon /></span>
          <div>
            <p className="account-kicker">{t('حسابي في لافينا', language)}</p>
            <h1>{language === 'ar' ? `أهلاً بك، ${user.first_name}` : `Welcome, ${user.first_name}`}</h1>
          </div>
        </div>
        <h2>{t('تفاصيل حسابك', language)}</h2>
        <AccountDetails user={user} language={language} />
        <section className="account-orders">
          <h2>{language === 'ar' ? 'طلباتي' : 'My orders'}</h2>
          {ordersError && <p className="error" role="alert">{t(ordersError, language)}</p>}
          {!ordersError && orders.length === 0 && <p className="empty">{language === 'ar' ? 'لا توجد طلبات مرتبطة بحسابك حتى الآن.' : 'There are no orders linked to your account yet.'}</p>}
          <div className="account-order-list">
            {orders.map(order => {
              const statusLabel = {
                pending: language === 'ar' ? 'بانتظار الموافقة' : 'Pending approval',
                confirmed: language === 'ar' ? 'تمت الموافقة' : 'Approved',
                shipped: language === 'ar' ? 'تم الشحن' : 'Shipped',
                delivered: language === 'ar' ? 'تم التسليم' : 'Delivered',
                cancelled: language === 'ar' ? 'مرفوض / ملغي' : 'Rejected / Cancelled',
                returned: language === 'ar' ? 'مرتجع' : 'Returned',
              }[order.status] || order.status;
              const paymentLabel = {
                fawry: language === 'ar' ? 'فوري' : 'Fawry',
                instapay: 'InstaPay',
                cod: language === 'ar' ? 'الدفع عند الاستلام' : 'Cash on delivery',
              }[order.payment_method] || order.payment_method;
              return (
                <article className="account-order" key={order.id}>
                  <header className="account-order-head">
                    <strong>#{order.id}</strong>
                    <span className={`status status-${order.status}`}>{statusLabel}</span>
                  </header>
                  <p>{language === 'ar' ? 'تاريخ الطلب' : 'Order date'}: {new Date(`${order.created_at.replace(' ', 'T')}Z`).toLocaleString(language === 'en' ? 'en-US' : 'ar-EG')}</p>
                  <p>{language === 'ar' ? 'طريقة الدفع' : 'Payment method'}: {paymentLabel}</p>
                  <ul>{order.items.map(item => (
                    <li key={item.id}>
                      <span>{item.name} × {item.quantity}</span>
                      <b>{egp(item.unit_price * item.quantity)}</b>
                    </li>
                  ))}</ul>
                  <strong className="account-order-total">{language === 'ar' ? 'الإجمالي' : 'Total'}: {egp(order.total)}</strong>
                </article>
              );
            })}
          </div>
        </section>
        <button className="btn line account-logout" onClick={logout}>{t('تسجيل الخروج', language)}</button>
      </section>
    );
  }

  return (
    <section className="auth">
      <div className="auth-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'login'} className={tab === 'login' ? 'on' : ''} onClick={() => setParams({})}>{t('تسجيل الدخول', language)}</button>
        <button role="tab" aria-selected={tab === 'register'} className={tab === 'register' ? 'on' : ''} onClick={() => setParams({ tab: 'register' })}>{t('إنشاء حساب', language)}</button>
      </div>
      <form onSubmit={submit} noValidate>
        {tab === 'register' && <>
          <Field label={t('الصفة*', language)}><select value={f.title} onChange={set('title')}><option value="السيد">{t('السيد', language)}</option><option value="السيدة">{t('السيدة', language)}</option><option value="الآنسة">{t('الآنسة', language)}</option></select></Field>
          <div className="two">
            <Field label={t('الاسم الأول', language)}><input required onChange={set('first_name')} autoComplete="given-name" /></Field>
            <Field label={t('الاسم الأخير', language)}><input required onChange={set('last_name')} autoComplete="family-name" /></Field>
          </div>
          <Field label={t('تاريخ الميلاد', language)}><input type="date" onChange={set('birth_date')} /></Field>
          <Field label={t('رقم الهاتف', language)}><div className="phone"><input inputMode="tel" dir="ltr" placeholder="10xxxxxxxx" onChange={set('phone')} autoComplete="tel-national" /><span>🇪🇬 +20</span></div></Field>
        </>}
        <Field label={t('البريد الإلكتروني', language)}><input type="email" dir="ltr" placeholder="jane@gmail.com" required onChange={set('email')} autoComplete="email" /></Field>
        <Field label={t('الرقم السري', language)}><input type="password" dir="ltr" required minLength={tab === 'register' ? 8 : undefined} onChange={set('password')} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} /></Field>
        {tab === 'register' && <>
          <Field label={t('تأكيد كلمة المرور', language)}><input type="password" dir="ltr" required onChange={e => setConfirm(e.target.value)} autoComplete="new-password" /></Field>
          <Field label={t('تاريخ عيد الزواج (اختياري)', language)}><input type="date" onChange={set('wedding_date')} /></Field>
          <label className="check"><input type="checkbox" checked={f.newsletter} onChange={set('newsletter')} /> {t('الاشتراك في النشرة الإخبارية', language)}</label>
        </>}
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn dark full" disabled={busy}>{busy ? t('جارٍ التنفيذ…', language) : t(tab === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب', language)}</button>
        <p className="switch">
          {tab === 'login'
            ? <>{t('ليس لديك حساب؟', language)} <button type="button" onClick={() => setParams({ tab: 'register' })}>{t('إنشاء حساب', language)}</button></>
            : <>{t('لديك حساب؟', language)} <button type="button" onClick={() => setParams({})}>{t('تسجيل الدخول', language)}</button></>}
        </p>
      </form>
    </section>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
