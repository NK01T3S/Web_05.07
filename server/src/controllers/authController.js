const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const redis = require('../config/redis');

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_change_me';
const ACCESS_EXPIRES_IN = '15m'; // 15 минут
const REFRESH_EXPIRES_IN = 7 * 24 * 60 * 60;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role }, 
    ACCESS_SECRET, 
    { expiresIn: ACCESS_EXPIRES_IN }
  );
  const refreshToken = jwt.sign(
    { id: user.id }, 
    REFRESH_SECRET, 
    { expiresIn: REFRESH_EXPIRES_IN }
  );
  return { accessToken, refreshToken };
}

function setRefreshCookie(res, refreshToken) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: false,
    maxAge: REFRESH_EXPIRES_IN * 1000,
    path: '/',
  });
}

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password || !name) return res.status(400).json({ error: 'Нужны поля email, password, name' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Некорректный email' });
    if (password.length < 6) return res.status(400).json({ error: 'Пароль должен быть не короче 6 символов' });

    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (exists.rowCount > 0) return res.status(409).json({ error: 'Пользователь с таким email уже существует' });

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, role`,
      [email, passwordHash, name.trim()]
    );
    const user = rows[0];
    
    const { accessToken, refreshToken } = generateTokens(user);
    await redis.set(`refresh_token:${user.id}`, refreshToken, { EX: REFRESH_EXPIRES_IN });
    
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ accessToken, user });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Нужны поля email и password' });

    const { rows } = await pool.query('SELECT id, email, name, role, password_hash FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Неверный email или пароль' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Неверный email или пароль' });

    delete user.password_hash;
    
    const { accessToken, refreshToken } = generateTokens(user);
    await redis.set(`refresh_token:${user.id}`, refreshToken, { EX: REFRESH_EXPIRES_IN });

    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user });
  } catch (err) { next(err); }
}

async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: 'Нет refresh токена' });

    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const storedToken = await redis.get(`refresh_token:${payload.id}`);
    
    if (!storedToken || storedToken !== refreshToken) {
      return res.status(403).json({ error: 'Refresh токен недействителен (возможно, выход из системы)' });
    }

    const dbUser = await pool.query('SELECT role FROM users WHERE id = $1', [payload.id]);
    const accessToken = jwt.sign(
      { id: payload.id, role: dbUser.rows[0].role }, 
      ACCESS_SECRET, 
      { expiresIn: ACCESS_EXPIRES_IN }
    );

    res.json({ accessToken });
  } catch (err) {
    res.clearCookie('refreshToken', { path: '/' });
    res.status(401).json({ error: 'Недействительный refresh токен' });
  }
}

async function logout(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, REFRESH_SECRET);
      await redis.del(`refresh_token:${payload.id}`);
    } catch (e) {}
  }
  res.clearCookie('refreshToken', { path: '/' });
  res.json({ ok: true });
}

async function me(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT id, email, name, role, created_at FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

module.exports = { register, login, refresh, logout, me };