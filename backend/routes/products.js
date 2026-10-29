// Products: browse (everyone) and manage (farmers)
const express = require('express');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

// The columns we send to the website for each product
const SELECT = `
  SELECT p.id, p.name, p.description, p.price, p.unit, p.stock_qty, p.badge, p.icon, p.is_active,
         p.category_id, c.name AS category, f.id AS farmer_id, f.farm_name, f.location
  FROM products p
  JOIN categories c ON c.id = p.category_id
  JOIN farmers f    ON f.id = p.farmer_id`;

// GET /api/products?search=tom&category=1&sort=price_asc&limit=4
router.get('/', async (req, res, next) => {
  try {
    const { search, category, sort, limit } = req.query;
    const where = ['p.is_active = 1'];
    const params = [];

    if (search) {
      where.push('(p.name LIKE ? OR f.farm_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      where.push('p.category_id = ?');
      params.push(Number(category));
    }

    const orderBy = {
      price_asc:  'p.price ASC',
      price_desc: 'p.price DESC',
      name:       'p.name ASC',
      newest:     'p.created_at DESC, p.id DESC'
    }[sort] || 'p.id ASC'; // "Featured" = default order

    let sql = `${SELECT} WHERE ${where.join(' AND ')} ORDER BY ${orderBy}`;
    if (limit) { sql += ' LIMIT ?'; params.push(Number(limit)); }

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/products/mine  (farmer's own products)  -- must be before /:id
router.get('/mine', requireAuth, requireRole('farmer'), async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `${SELECT} WHERE f.user_id = ? ORDER BY p.id DESC`, [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(`${SELECT} WHERE p.id = ? AND p.is_active = 1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// Check the product form fields
function validate(body) {
  const { name, category_id, price, unit, stock_qty } = body;
  if (!name || !category_id || price === undefined || price === '' || !unit) return 'Name, category, price and unit are required.';
  if (isNaN(price) || Number(price) <= 0) return 'Price must be a number above 0.';
  if (stock_qty !== undefined && (isNaN(stock_qty) || Number(stock_qty) < 0)) return 'Stock must be 0 or more.';
  return null;
}

// POST /api/products  (farmer adds a product)
router.post('/', requireAuth, requireRole('farmer'), async (req, res, next) => {
  try {
    const problem = validate(req.body);
    if (problem) return res.status(400).json({ error: problem });

    const [farm] = await db.query('SELECT id FROM farmers WHERE user_id = ?', [req.user.id]);
    if (!farm.length) return res.status(400).json({ error: 'Farm profile not found.' });

    const { name, description, category_id, price, unit, stock_qty, badge, icon } = req.body;
    const [result] = await db.query(
      `INSERT INTO products (farmer_id, category_id, name, description, price, unit, stock_qty, badge, icon)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [farm[0].id, category_id, name.trim(), description || '', price, unit, stock_qty || 0, badge || null, icon || '🌱']
    );
    res.status(201).json({ id: result.insertId, message: 'Product added.' });
  } catch (err) { next(err); }
});

// PUT /api/products/:id  (farmer edits own product, admin can edit any)
router.put('/:id', requireAuth, requireRole('farmer', 'admin'), async (req, res, next) => {
  try {
    const problem = validate(req.body);
    if (problem) return res.status(400).json({ error: problem });

    const { name, description, category_id, price, unit, stock_qty, badge, icon, is_active } = req.body;
    const ownerCheck = req.user.role === 'admin' ? '' : 'AND farmer_id = (SELECT id FROM farmers WHERE user_id = ?)';
    const params = [name.trim(), description || '', category_id, price, unit, stock_qty || 0, badge || null, icon || '🌱',
                    is_active === 0 || is_active === false ? 0 : 1, req.params.id];
    if (req.user.role !== 'admin') params.push(req.user.id);

    const [result] = await db.query(
      `UPDATE products SET name=?, description=?, category_id=?, price=?, unit=?, stock_qty=?, badge=?, icon=?, is_active=?
       WHERE id = ? ${ownerCheck}`, params
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Product not found or not yours.' });
    res.json({ message: 'Product updated.' });
  } catch (err) { next(err); }
});

// DELETE /api/products/:id  (hides it so old orders still work)
router.delete('/:id', requireAuth, requireRole('farmer', 'admin'), async (req, res, next) => {
  try {
    const ownerCheck = req.user.role === 'admin' ? '' : 'AND farmer_id = (SELECT id FROM farmers WHERE user_id = ?)';
    const params = [req.params.id];
    if (req.user.role !== 'admin') params.push(req.user.id);
    const [result] = await db.query(`UPDATE products SET is_active = 0 WHERE id = ? ${ownerCheck}`, params);
    if (!result.affectedRows) return res.status(404).json({ error: 'Product not found or not yours.' });
    res.json({ message: 'Product removed.' });
  } catch (err) { next(err); }
});

module.exports = router;
