module.exports = function errorHandler(err, req, res, next) {
  // Если ошибка ещё не помечена статусом — считаем её внутренней (500).
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Внутренняя ошибка сервера';

  console.error(`[error] ${req.method} ${req.originalUrl} -> ${status}: ${message}`);
  if (status >= 500) {
    console.error(err.stack);
  }

  res.status(status).json({ error: message });
};