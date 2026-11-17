import { useEffect, useState } from 'react';
import api from '../api/client';
import AdCard from '../components/AdCard';

const LIMIT = 12;

export default function Home() {
  const [ads, setAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [filterInput, setFilterInput] = useState({
    category_id: '', price_min: '', price_max: '', search: '',
  });
  const [activeFilter, setActiveFilter] = useState({});

  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data))
      .catch((err) => console.error('Ошибка категорий:', err));
  }, []);

  useEffect(() => {
    let ignore = false;
    const params = { ...activeFilter, limit: LIMIT, offset };

    api.get('/ads', { params })
      .then((res) => {
        if (ignore) return;
        if (offset === 0) setAds(res.data);
        else setAds((prev) => [...prev, ...res.data]);
        setHasMore(res.data.length === LIMIT);
      })
      .catch((err) => {
        if (!ignore) alert('Ошибка загрузки: ' + err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => { ignore = true; };
  }, [activeFilter, offset]);

  function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setOffset(0);
    setActiveFilter(filterInput);
  }

  function handleLoadMore() {
    setLoading(true);
    setOffset(offset + LIMIT);
  }

  function handleChange(e) {
    setFilterInput({ ...filterInput, [e.target.name]: e.target.value });
  }

  return (
    <div>
      <h1>Доска объявлений</h1>

      <form className="filters" onSubmit={handleSearch}>
        <div className="filter-group">
          <label>Категория</label>
          <select name="category_id" value={filterInput.category_id} onChange={handleChange}>
            <option value="">Все</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Цена от</label>
          <input type="number" name="price_min" value={filterInput.price_min} onChange={handleChange} placeholder="0" />
        </div>
        <div className="filter-group">
          <label>Цена до</label>
          <input type="number" name="price_max" value={filterInput.price_max} onChange={handleChange} placeholder="1000000" />
        </div>
        <div className="filter-group" style={{ flex: 1 }}>
          <label>Поиск</label>
          <input type="text" name="search" value={filterInput.search} onChange={handleChange} placeholder="Что ищем?" />
        </div>
        <button type="submit">Найти</button>
      </form>

      {loading && offset === 0 ? (
        <p>Загрузка…</p>
      ) : ads.length === 0 ? (
        <p className="muted">По вашему запросу ничего не найдено.</p>
      ) : (
        <div className="listings-grid">
          {ads.map((ad) => <AdCard key={ad.id} ad={ad} />)}
        </div>
      )}

      {hasMore && !loading && ads.length > 0 && (
        <button className="load-more" onClick={handleLoadMore}>Показать ещё</button>
      )}
      {loading && offset > 0 && <p className="muted" style={{ textAlign: 'center' }}>Загрузка…</p>}
    </div>
  );
}