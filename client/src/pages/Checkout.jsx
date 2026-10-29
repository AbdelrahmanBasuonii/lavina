import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, egp } from '../api.js';
import { useStore } from '../store.jsx';

const paymentOptions = [
  ['fawry', 'فوري', 'Fawry'],
  ['instapay', 'إنستا باي', 'InstaPay'],
  ['cod', 'الدفع عند الاستلام', 'Cash on delivery'],
];

export default function Checkout() {
  const { token, user, cart, cartTotal, setCart, language } = useStore();
  const en = language === 'en';
  const L = (ar, english) => en ? english : ar;
  const [address, setAddress] = useState({
    governorate: '', city: '', street: '', phone: user?.phone || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [busy, setBusy] = useState(false);
  const setField = event => setAddress(current => ({ ...current, [event.target.name]: event.target.value }));

  if (!user || !token) return <Navigate to="/account" state={{ from: '/checkout' }} replace />;
  if (orderId) {
    return <section className="wrap section checkout">
      <div className="checkout-success">
        <h1>{L('تم إرسال طلبك للمراجعة', 'Your order has been submitted for review')}</h1>
        <p>{L('طلبك رقم', 'Your order number is')} #{orderId} {L('بانتظار مراجعة الأدمن والموافقة عليه.', 'is awaiting admin review and approval.')}</p>
        <Link className="btn dark" to="/">{L('العودة للمتجر', 'Return to shop')}</Link>
      </div>
    </section>;
  }
  if (!cart.length) {
    return <section className="wrap section checkout">
      <h1>{L('سلة التسوق فارغة', 'Your shopping bag is empty')}</h1>
      <Link className="btn dark" to="/">{L('متابعة التسوق', 'Continue shopping')}</Link>
    </section>;
  }

  const submitOrder = async event => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await api('/orders', {
        method: 'POST',
        token,
        body: {
          ...address,
          payment_method: paymentMethod,
          items: cart.map(({ product, quantity }) => ({ product_id: Number(product.id), quantity })),
        },
      });
      setCart([]);
      setOrderId(result.id);
    } catch (ex) {
      setError(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="wrap section checkout">
      <h1>{L('إتمام الشراء', 'Checkout')}</h1>
      <form className="checkout-layout" onSubmit={submitOrder}>
        <div className="checkout-fields">
          <section className="checkout-panel">
            <h2>{L('عنوان التوصيل', 'Delivery address')}</h2>
            <div className="checkout-grid">
              <label>{L('المحافظة', 'Governorate')}<input name="governorate" value={address.governorate} onChange={setField} required autoComplete="address-level1" /></label>
              <label>{L('المدينة', 'City')}<input name="city" value={address.city} onChange={setField} required autoComplete="address-level2" /></label>
              <label className="checkout-street">{L('العنوان بالتفصيل', 'Street address')}<textarea name="street" value={address.street} onChange={setField} required rows="3" autoComplete="street-address" /></label>
              <label>{L('رقم الهاتف للتوصيل', 'Delivery phone')}<input name="phone" type="tel" dir="ltr" value={address.phone} onChange={setField} required minLength="8" autoComplete="tel" /></label>
            </div>
          </section>
          <section className="checkout-panel">
            <h2>{L('طريقة الدفع', 'Payment method')}</h2>
            <div className="payment-options">
              {paymentOptions.map(([value, ar, english]) => (
                <label key={value} className={paymentMethod === value ? 'payment-option selected' : 'payment-option'}>
                  <input type="radio" name="payment_method" value={value} checked={paymentMethod === value}
                    onChange={() => setPaymentMethod(value)} />
                  <span>{L(ar, english)}</span>
                </label>
              ))}
            </div>
            <p className="checkout-note">{L('سيتم إرسال الطلب للأدمن لمراجعته قبل تأكيده.', 'Your order will be sent to the admin for review before it is confirmed.')}</p>
          </section>
        </div>
        <aside className="checkout-panel checkout-summary">
          <h2>{L('ملخص الطلب', 'Order summary')}</h2>
          <ul>{cart.map(({ product, quantity }) => (
            <li key={product.id}>
              <span>{en ? (product.name_en || product.name) : product.name} × {quantity}</span>
              <b>{egp(product.final_price * quantity)}</b>
            </li>
          ))}</ul>
          <div className="checkout-total"><strong>{L('الإجمالي', 'Total')}</strong><b>{egp(cartTotal)}</b></div>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn dark full" disabled={busy}>
            {busy ? L('جارٍ إرسال الطلب…', 'Submitting order…') : L('تأكيد وإرسال الطلب', 'Confirm and submit order')}
          </button>
        </aside>
      </form>
    </section>
  );
}
