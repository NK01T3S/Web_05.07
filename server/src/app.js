require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const adsRoutes = require('./routes/ads');
const errorHandler = require('./middleware/error');

const app = express();

app.use(cors());

app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/ads', adsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Не найдено: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});