const pool = require('../config/db');

function toInt(v, fallback = null) {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

async function list(req, res, next) {
  try {
    const { category_id, price_min, price_max, search } = req.query;

    const conditions = ["a.status = 'active'"];
    const values = [];

    const catId = toInt(category_id);
    if (catId) {
      values.push(catId);
      conditions.push(`a.category_id = $${values.length}`);
    }
    const pmin = toInt(price_min);
    if (pmin !== null && pmin >= 0) {
      values.push(pmin);
      conditions.push(`a.price >= $${values.length}`);
    }
    const pmax = toInt(price_max);
    if (pmax !== null && pmax >= 0) {
      values.push(pmax);
      conditions.push(`a.price <= $${values.length}`);
    }
    if (search && String(search).trim()) {
      values.push(`%${String(search).trim()}%`);
      conditions.push(`a.title ILIKE $${values.length}`);
    }

    const whereSQL = 'WHERE ' + conditions.join(' AND ');

    const lim = Math.min(Math.max(toInt(req.query.limit, 12) || 12, 1), 50);
    const off = Math.max(toInt(req.query.offset, 0) || 0, 0);
    values.push(lim, off);

    const sql = `
      SELECT
        a.id, a.title, a.description, a.price, a.city, a.image_url,
        a.status, a.views, a.created_at, a.updated_at,
        a.category_id, c.name AS category_name, c.slug AS category_slug,
        a.user_id, u.name AS user_name
      FROM ads a
      JOIN categories c ON c.id = a.category_id
      JOIN users u      ON u.id = a.user_id
      ${whereSQL}
      ORDER BY a.created_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `;

    const { rows } = await pool.query(sql, values);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function myAds(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.title, a.description, a.price, a.city, a.image_url,
              a.status, a.views, a.created_at, a.updated_at,
              a.category_id, c.name AS category_name, c.slug AS category_slug
         FROM ads a
         JOIN categories c ON c.id = a.category_id
        WHERE a.user_id = $1
        ORDER BY a.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const id = toInt(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ error: 'Некорректный id' });
    }

    const { rows } = await pool.query(
      `UPDATE ads
          SET views = views + 1
        WHERE id = $1
        RETURNING id, title, description, price, city, image_url,
                  status, views, created_at, updated_at,
                  category_id, user_id`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Объявление не найдено' });
    }

    const ad = rows[0];
    const extra = await pool.query(
      `SELECT c.name AS category_name, c.slug AS category_slug,
              u.name AS user_name
         FROM categories c, users u
        WHERE c.id = $1 AND u.id = $2`,
      [ad.category_id, ad.user_id]
    );
    Object.assign(ad, extra.rows[0] || {});
    res.json(ad);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, description, price, city, image_url, category_id, status = 'active' } =
      req.body || {};

    if (!title || !description || price === undefined || !city || !category_id) {
      return res.status(400).json({
        error: 'Нужны поля: title, description, price, city, category_id',
      });
    }
    if (String(title).trim().length < 3) {
      return res.status(400).json({ error: 'title минимум 3 символа' });
    }
    if (String(description).trim().length < 10) {
      return res.status(400).json({ error: 'description минимум 10 символов' });
    }
    const numPrice = Number(price);
    if (!Number.isFinite(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'price должен быть числом >= 0' });
    }
    if (!['active', 'sold'].includes(status)) {
      return res.status(400).json({ error: 'status: только active или sold' });
    }
    const catId = toInt(category_id);
    if (!catId) {
      return res.status(400).json({ error: 'category_id должен быть числом' });
    }

    const cat = await pool.query('SELECT 1 FROM categories WHERE id = $1', [catId]);
    if (cat.rowCount === 0) {
      return res.status(400).json({ error: 'Категория не найдена' });
    }

    const { rows } = await pool.query(
      `INSERT INTO ads
         (title, description, price, city, image_url, category_id, status, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, description, price, city, image_url, status,
                 category_id, user_id, views, created_at, updated_at`,
      [
        String(title).trim(),
        String(description).trim(),
        numPrice,
        String(city).trim(),
        image_url ? String(image_url).trim() : null,
        catId,
        status,
        req.user.id,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const id = toInt(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ error: 'Некорректный id' });
    }

    const own = await pool.query('SELECT user_id FROM ads WHERE id = $1', [id]);
    if (own.rowCount === 0) {
      return res.status(404).json({ error: 'Объявление не найдено' });
    }
    if (own.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Можно редактировать только свои объявления' });
    }

    const { title, description, price, city, image_url, category_id, status } =
      req.body || {};

    if (title !== undefined && String(title).trim().length < 3) {
      return res.status(400).json({ error: 'title минимум 3 символа' });
    }
    if (description !== undefined && String(description).trim().length < 10) {
      return res.status(400).json({ error: 'description минимум 10 символов' });
    }
    let numPrice = null;
    if (price !== undefined) {
      numPrice = Number(price);
      if (!Number.isFinite(numPrice) || numPrice < 0) {
        return res.status(400).json({ error: 'price должен быть числом >= 0' });
      }
    }
    if (status !== undefined && !['active', 'sold'].includes(status)) {
      return res.status(400).json({ error: 'status: только active или sold' });
    }
    let catId = null;
    if (category_id !== undefined) {
      catId = toInt(category_id);
      if (!catId) return res.status(400).json({ error: 'category_id должен быть числом' });
      const cat = await pool.query('SELECT 1 FROM categories WHERE id = $1', [catId]);
      if (cat.rowCount === 0) {
        return res.status(400).json({ error: 'Категория не найдена' });
      }
    }

    const { rows } = await pool.query(
      `UPDATE ads SET
         title       = COALESCE($1, title),
         description = COALESCE($2, description),
         price       = COALESCE($3, price),
         city        = COALESCE($4, city),
         image_url   = COALESCE($5, image_url),
         category_id = COALESCE($6, category_id),
         status      = COALESCE($7, status),
         updated_at  = NOW()
       WHERE id = $8
       RETURNING id, title, description, price, city, image_url, status,
                 category_id, user_id, views, created_at, updated_at`,
      [
        title !== undefined ? String(title).trim() : null,
        description !== undefined ? String(description).trim() : null,
        numPrice,
        city !== undefined ? String(city).trim() : null,
        image_url !== undefined ? String(image_url).trim() : null,
        catId,
        status !== undefined ? status : null,
        id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const id = toInt(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ error: 'Некорректный id' });
    }

    const ad = await pool.query('SELECT user_id FROM ads WHERE id = $1', [id]);
    if (ad.rowCount === 0) {
      return res.status(404).json({ error: 'Объявление не найдено' });
    }

    if (ad.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Вы можете удалять только свои объявления' });
    }

    await pool.query('DELETE FROM ads WHERE id = $1', [id]);
    res.json({ ok: true, id: Number(id) });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, myAds, getById, create, update, remove };