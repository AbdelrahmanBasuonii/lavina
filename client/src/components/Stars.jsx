import { useStore } from '../store.jsx';

export default function Stars({ value = 0, size = 13 }) {
  const { language } = useStore();
  return (
    <span className="stars" aria-label={language === 'ar' ? `التقييم ${value} من 5` : `Rating ${value} out of 5`} style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map(i => <span key={i} className={i <= Math.round(value) ? 'on' : ''}>★</span>)}
    </span>
  );
}
