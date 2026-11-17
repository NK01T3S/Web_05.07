import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useAuth } from './context/useAuth';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import AdDetail from './pages/AdDetail';
import AdForm from './pages/AdForm'
import MyAds from './pages/MyAds';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p style={{ padding: 24 }}>Загрузка…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="container">
        <Routes>
          {/* Публичные */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/ads/new" element={<RequireAuth><AdForm /></RequireAuth>} />
          <Route path="/ads/:id" element={<AdDetail />} />          
          <Route path="/ads/:id/edit" element={<RequireAuth><AdForm /></RequireAuth>} />
          <Route path="/my" element={<RequireAuth><MyAds /></RequireAuth>} />

          {/* 404 */}
          <Route path="*" element={<div className="page-narrow"><h1>404</h1><p>Страница не найдена. <Link to="/">На главную</Link></p></div>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}