import { Link } from 'react-router-dom';

export default function AdCard({ ad }) {
  const priceFormatted = Number(ad.price).toLocaleString('ru-RU');

  return (
    <div className="listing-card">
      <Link to={`/ads/${ad.id}`} style={{ display: 'block', height: '180px', background: '#e5e7eb', overflow: 'hidden' }}>
        {ad.image_url ? (
          <img 
            src={ad.image_url} 
            alt={ad.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '14px' }}>
            Нет фото
          </div>
        )}
      </Link>
      <div className="listing-body">
        <Link to={`/ads/${ad.id}`} className="listing-title">{ad.title}</Link>
        <p className="listing-price">{priceFormatted} ₽</p>
        <p className="listing-meta">
          {ad.city} · {ad.category_name}
        </p>
      </div>
    </div>
  );
}