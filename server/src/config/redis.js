const { createClient } = require('redis');

const client = createClient({ 
  url: process.env.REDIS_URL || 'redis://redis:6379' 
});

client.on('error', (err) => console.log('Redis Client Error', err));

client.connect()
  .then(() => console.log('Redis подключен'))
  .catch((err) => console.error('Ошибка подключения к Redis:', err.message));

module.exports = client;