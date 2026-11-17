const pool = require('../config/db');

async function list(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, slug FROM categories ORDER BY name ASC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, slug } = req.body || {};

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Поле name обязательно (минимум 2 символа)' });
    }

    const finalSlug = (slug && String(slug).trim()) || slugify(name);

    if (!/^[a-z0-9-]+$/.test(finalSlug)) {
      return res.status(400).json({
        error: 'slug может содержать только латиницу, цифры и дефис',
      });
    }

    const dup = await pool.query(
      'SELECT 1 FROM categories WHERE name = $1 OR slug = $2',
      [name.trim(), finalSlug]
    );
    if (dup.rowCount > 0) {
      return res.status(409).json({ error: 'Категория с таким name или slug уже есть' });
    }

    const { rows } = await pool.query(
      'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id, name, slug',
      [name.trim(), finalSlug]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

function slugify(text) {
  const map = {
    а:'a', б:'b', в:'v', г:'g', д:'d', е:'e', ё:'e', ж:'zh', з:'z', и:'i',
    й:'y', к:'k', л:'l', м:'m', н:'n', о:'o', п:'p', р:'r', с:'s', т:'t',
    у:'u', ф:'f', х:'h', ц:'ts', ч:'ch', ш:'sh', щ:'sch', ъ:'', ы:'y',
    ь:'', э:'e', ю:'yu', я:'ya',
  };
  return text
    .toLowerCase()
    .split('')
    .map((ch) => (map[ch] !== undefined ? map[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]+/g, '-') 
    .replace(/^-+|-+$/g, '');    
}

module.exports = { list, create };