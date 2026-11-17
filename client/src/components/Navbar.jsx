import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <Link to="/" className="brand">📋 Доска</Link>
          {user && (
            <NavLink to="/my" className="nav-link">Мои объявления</NavLink>
          )}
        </div>

        <div className="navbar-right">
          {loading ? (
            <span className="muted">…</span>
          ) : user ? (
            <>
              <span className="nav-user">
                {user.name}
                {user.role === 'admin' && <span className="badge">admin</span>}
              </span>
              <Link to="/ads/new" className="btn-primary">+ Создать</Link>
              <button onClick={onLogout} className="btn-ghost">Выйти</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link">Войти</NavLink>
              <NavLink to="/register" className="btn-primary">Регистрация</NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}