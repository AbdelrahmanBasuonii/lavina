import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, egp } from '../api.js';
import { useStore } from '../store.jsx';
import Stars from '../components/Stars.jsx';
import { productDescription, productName, t } from '../i18n.js';

export default function Product() {
  const { id } = useParams();
  const { addToCart, token, language } = useStore();
  const [p, setP] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    api(`/products/${id}`).then(setP).catch(() => setP(false));
    api(`/products/${id}/reviews`).then(setReviews).catch(() => {});
  };
  useEffect(load, [id]);

  const submit = async (e) => {
    e.preventDefault(); setMsg('');
    try { await api(`/products/${id}/reviews`, { method: 'POST', token, body: { rating, comment } }); setComment(''); load(); }
    catch (ex) { setMsg(ex.message); }
  };

  if (p === false) return <p className="wrap empty">{t('المنتج غير موجود.', language)}</p>;
  if (!p) return <p className="wrap empty">{t('جارٍ التحميل…', language)}</p>;
  const name = productName(p, language);
  return (
    <section className="wrap section pdp">
      <div className="pdp-img"><img src={p.images[0]} alt={name} /></div>
      <div className="pdp-info">
        <span className="brand">{t('لافينا', language)}</span>
        <h1>{name}</h1>
        <div className="rate"><Stars value={p.rating_avg} size={16} /> <small>({p.rating_count} {t('تقييم', language)})</small></div>
        <p className="price big">
          {p.discount_percent > 0 ? <><b className="sale">{egp(p.final_price)}</b><small>-{p.discount_percent}%</small><s>{egp(p.price)}</s></> : <b>{egp(p.price)}</b>}
        </p>
        <p>{productDescription(p, language)}</p>
        <dl className="specs">
          <dt>{t('كود المنتج', language)}</dt><dd dir="ltr">{p.sku}</dd>
          {p.karat && <><dt>{t('العيار', language)}</dt><dd>{p.karat} {t('قيراط', language)}</dd></>}
          {p.weight_g && <><dt>{t('الوزن التقريبي', language)}</dt><dd>{p.weight_g} {t('جرام', language)}</dd></>}
          <dt>{t('التوفر', language)}</dt><dd>{t(p.stock > 0 ? 'متوفر' : 'غير متوفر حاليًا', language)}</dd>
        </dl>
        <button className="btn dark full" disabled={p.stock < 1} onClick={() => addToCart(p)}>{t('أضف إلى السلة', language)}</button>
      </div>

      <div className="reviews">
        <h2>{t('تقييمات العملاء', language)}</h2>
        {reviews.length === 0 && <p className="empty">{t('لا توجد تقييمات بعد. كن أول من يقيّم هذه القطعة.', language)}</p>}
        <ul>{reviews.map(r => <li key={r.id}><Stars value={r.rating} /> <b>{r.first_name}</b><p>{r.comment}</p></li>)}</ul>
        {token ? (
          <form onSubmit={submit} className="review-form">
            <label>{t('تقييمك', language)} <select value={rating} onChange={e => setRating(+e.target.value)}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder={t('اكتب رأيك في القطعة', language)} rows={3} />
            {msg && <p className="error">{t(msg, language)}</p>}
            <button className="btn dark">{t('إرسال التقييم', language)}</button>
          </form>
        ) : <p className="empty">{t('سجّل الدخول لإضافة تقييم.', language)}</p>}
      </div>
    </section>
  );
}
