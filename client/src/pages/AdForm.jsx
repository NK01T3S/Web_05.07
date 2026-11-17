import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function AdForm() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    city: '',
    category_id: '',
    image_url: '',
    status: 'active',
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit); 
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data))
      .catch((err) => console.error('Ошибка категорий:', err));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    
    api.get(`/ads/${id}`)
      .then((res) => {
        const ad = res.data;
        setForm({
          title: ad.title || '',
          description: ad.description || '',
          price: ad.price || '',
          city: ad.city || '',
          category_id: ad.category_id || '',
          image_url: ad.image_url || '',
          status: ad.status || 'active',
        });
      })
      .catch((err) => {
        alert('Ошибка загрузки объявления: ' + err.message);
        navigate('/', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEdit) {
        await api.put(`/ads/${id}`, form);
      } else {
        await api.post('/ads', form);
      }
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Ошибка сохранения';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p>Загрузка…</p>;

  return (
    <div className="page-narrow" style={{ maxWidth: '640px' }}>
      <h1>{isEdit ? 'Редактирование' : 'Новое объявление'}</h1>
      
      <form onSubmit={onSubmit} className="form">
        <label>
          Заголовок
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            minLength={3}
            placeholder="Например: Продам велосипед"
          />
        </label>

        <div style={{ display: 'flex', gap: '16px' }}>
          <label style={{ flex: 1 }}>
            Цена (₽)
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              required
              min={0}
              placeholder="15000"
            />
          </label>
          <label style={{ flex: 1 }}>
            Город
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              required
              placeholder="Москва"
            />
          </label>
        </div>

        <label>
          Категория
          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Выберите категорию</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label>
          Ссылка на фото (не обязательно)
          <input
            type="url"
            name="image_url"
            value={form.image_url}
            onChange={handleChange}
            placeholder="https://example.com/photo.jpg"
          />
        </label>

        <label>
          Описание
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            minLength={10}
            rows={5}
            placeholder="Подробное описание товара или услуги"
            style={{ fontFamily: 'inherit', padding: '9px 11px', border: '1px solid #d1d5db', borderRadius: '6px', resize: 'vertical' }}
          />
        </label>

        {isEdit && (
          <label>
            Статус
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="active">Активно</option>
              <option value="sold">Продано</option>
            </select>
          </label>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Сохранение…' : (isEdit ? 'Сохранить изменения' : 'Опубликовать')}
        </button>
      </form>
    </div>
  );
}