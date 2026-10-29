import { Link } from 'react-router-dom';
import { egp } from '../api.js';
import { useStore } from '../store.jsx';
import Stars from './Stars.jsx';
import { Heart } from './Icons.jsx';
import { productName, t } from '../i18n.js';

export default function ProductCard({ p }) {
  const { wish, toggleWish, language } = useStore();
  const liked = wish.includes(p.id);
  return (
    <article className="card">
      <div className="card-img">
        <Link to={`/p/${p.id}`}><img src={p.images[0]} alt={productName(p, language)} loading="lazy" /></Link>
        <button className="wish" onClick={() => toggleWish(p.id)} aria-label={t(liked ? 'إزالة من قائمة الأمنيات' : 'أضف إلى قائمة الأمنيات', language)}>
          <Heart fill={liked} />
        </button>
      </div>
      <Link to={`/p/${p.id}`} className="card-body">
        <span className="brand">{t('لافينا', language)}</span>
        <h3>{productName(p, language)}</h3>
        <Stars value={p.rating_avg} />
        <p className="price">
          {p.discount_percent > 0 ? (
            <><b className="sale">{egp(p.final_price)}</b><small>-{p.discount_percent}%</small><s>{egp(p.price)}</s></>
          ) : <b>{egp(p.price)}</b>}
        </p>
      </Link>
    </article>
  );
}
