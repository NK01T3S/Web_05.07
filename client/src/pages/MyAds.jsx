import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; 
import api from '../api/client';

export default function MyAds() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    api.get('/ads/my')
      .then((res) => {
        if (!ignore) setAds(res.data);
      })
      .catch((err) => {
        if (!ignore) alert('Ошибка загрузки: ' + err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => { ignore = true; };
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('Удалить это объявление?')) return;

    try {
      await api.delete(`/ads/${id}`);
      setAds((prev) => prev.filter((ad) => ad.id !== id));
    } catch (err) {
      alert('Ошибка удаления: ' + (err.response?.data?.error || err.message));
    }
  }

  if (loading) return <p>Загрузка…</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Мои объявления</h1>
        <Link to="/ads/new" className="btn-primary">+ Создать</Link>
      </div>

      {ads.length === 0 ? (
        <p className="muted">У вас пока нет объявлений.</p>
      ) : (
        <div className="my-listings-list">
          {ads.map((ad) => (
            <div key={ad.id} className="my-listing-row">
              <div className="my-ad-info">
                <Link to={`/ads/${ad.id}`} className="my-ad-title">{ad.title}</Link>
                <div className="my-ad-meta">
                  <span>{Number(ad.price).toLocaleString('ru-RU')} ₽</span>
                  <span>·</span>
                  <span>{ad.category_name}</span>
                  <span>·</span>
                  <span>{ad.views} просмотров</span>
                </div>
              </div>
              <div className="my-ad-actions">
                <span className={`status-badge ${ad.status}`}>
                  {ad.status === 'active' ? 'Активно' : 'Продано'}
                </span>
                <Link to={`/ads/${ad.id}/edit`} className="btn-ghost" style={{ textDecoration: 'none', fontSize: '13px' }}>Ред.</Link>
                <button onClick={() => handleDelete(ad.id)} className="btn-danger" style={{ padding: '6px 10px', fontSize: '13px' }}>Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}