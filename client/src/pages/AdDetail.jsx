import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/useAuth';

export default function AdDetail() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    
    api.get(`/ads/${id}`)
      .then((res) => {
        if (!ignore) {
          setAd(res.data);
          setError('');
        }
      })
      .catch((err) => {
        if (!ignore) {
          if (err.response?.status === 404) {
            setError('Объявление не найдено или было удалено.');
          } else {
            setError('Ошибка загрузки: ' + err.message);
          }
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => { ignore = true; };
  }, [id]);

  async function handleDelete() {
    if (!window.confirm('Вы уверены, что хотите удалить это объявление?')) return;

    try {
      await api.delete(`/ads/${id}`);
      navigate('/', { replace: true }); 
    } catch (err) {
      alert('Ошибка удаления: ' + (err.response?.data?.error || err.message));
    }
  }

  if (loading) return <p style={{ padding: 24 }}>Загрузка…</p>;
  if (error) return <div className="page-narrow"><p className="error-msg">{error}</p><Link to="/">← На главную</Link></div>;
  if (!ad) return null;

  const isOwner = user && (user.id === ad.user_id || user.role === 'admin');  
  
  const dateFormatted = new Date(ad.created_at).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="listing-detail-wrapper">
      <Link to="/" className="back-link">← Назад к объявлениям</Link>
      
      <div className="listing-detail">
        {/* Левая колонка: Фото */}
        <div className="listing-detail-image">
          {ad.image_url ? (
            <img 
              src={ad.image_url} 
              alt={ad.title} 
              onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Нет+фото'; }} 
            />
          ) : (
            <span className="muted">Нет фото</span>
          )}
        </div>

        {/* Правая колонка: Информация */}
        <div className="listing-detail-info">
          <div className="listing-detail-header">
            <h1>{ad.title}</h1>
            {ad.status === 'sold' && <span className="status-badge sold">Продано</span>}
          </div>
          
          <p className="listing-detail-price">{Number(ad.price).toLocaleString('ru-RU')} ₽</p>
          
          <div className="listing-detail-meta">
            <span>📍 {ad.city}</span>
            <span>📂 {ad.category_name}</span>
            <span>👁 {ad.views} просмотров</span>
          </div>

          <div className="listing-detail-desc">
            <h3>Описание</h3>
            <p>{ad.description}</p>
          </div>

          <div className="listing-detail-author">
            <p>Автор: <strong>{ad.user_name}</strong></p>
            <p className="muted" style={{ fontSize: '13px' }}>Опубликовано: {dateFormatted}</p>
          </div>

          {/* Кнопки управления видны только автору */}
          {isOwner && (
            <div className="listing-detail-actions">
              <Link to={`/ads/${ad.id}/edit`} className="btn-primary">Редактировать</Link>
              <button onClick={handleDelete} className="btn-danger">Удалить</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}