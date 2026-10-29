// Orders: buyers place them, farmers/admin update them
const express = require('express');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();
const DELIVERY_FEE = 100; // flat fee added to every order

// POST /api/orders   (buyer)
// body: { items:[{product_id, quantity}], delivery_address, phone, payment_method }
router.post('/', requireAuth, requireRole('buyer'), async (req, res, next) => {
  let conn;
  try {
    conn = await db.getConnection();
    const { items, delivery_address, phone, payment_method } = req.body;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Your cart is empty.' });
    if (!delivery_address || !phone) return res.status(400).json({ error: 'Delivery address and phone are required.' });
    // FIX D6: validate phone and address length
    if (!/^[0-9+\s-]{7,20}$/.test(String(phone))) return res.status(400).json({ error: 'Enter a valid phone number.' });
    if (String(delivery_address).length > 255) return res.status(400).json({ error: 'Delivery address is too long.' });
    // FIX D2: merge duplicate product lines so stock is checked against the combined quantity
    const merged = new Map();
    for (const it of items) {
      const id = Number(it.product_id), q = parseInt(it.quantity, 10);
      if (!Number.isInteger(id) || !q || q < 1) return res.status(400).json({ error: 'Invalid item in your cart.' });
      merged.set(id, (merged.get(id) || 0) + q);
    }
    const mergedItems = [...merged].map(([product_id, quantity]) => ({ product_id, quantity }));

    await conn.beginTransaction(); // all-or-nothing: either the whole order is saved or nothing
    let total = 0;
    const lines = [];

    for (const item of mergedItems) {
      const qty = parseInt(item.quantity, 10);
      if (!qty || qty < 1) throw Object.assign(new Error('Quantity must be at least 1.'), { status: 400 });

      const [rows] = await conn.query(
        'SELECT id, name, price, stock_qty FROM products WHERE id = ? AND is_active = 1 FOR UPDATE', [item.product_id]
      );
      if (!rows.length) throw Object.assign(new Error('A product in your cart is no longer available.'), { status: 400 });
      if (rows[0].stock_qty < qty) {
        throw Object.assign(new Error(`Only ${rows[0].stock_qty} of ${rows[0].name} left in stock.`), { status: 400 });
      }
      total += Number(rows[0].price) * qty;
      lines.push({ product_id: rows[0].id, qty, price: rows[0].price });
    }

    total += DELIVERY_FEE;
    const [order] = await conn.query(
      'INSERT INTO orders (buyer_id, total_amount, delivery_address, phone, payment_method) VALUES (?,?,?,?,?)',
      [req.user.id, total, delivery_address, phone, payment_method === 'cash' ? 'cash' : 'mpesa']
    );
    for (const l of lines) {
      await conn.query('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?,?,?,?)',
        [order.insertId, l.product_id, l.qty, l.price]);
      await conn.query('UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?', [l.qty, l.product_id]);
    }
    await conn.commit();
    res.status(201).json({ id: order.insertId, total, message: 'Order placed!' });
  } catch (err) {
    if (conn) await conn.rollback().catch(() => {});
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  } finally {
    if (conn) conn.release();
  }
});

// Fetch the items of a list of orders and attach them
async function attachItems(orders) {
  if (!orders.length) return orders;
  const ids = orders.map((o) => o.id);
  const [items] = await db.query(
    `SELECT oi.order_id, oi.quantity, oi.unit_price, p.name, p.unit, p.icon, f.farm_name
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     JOIN farmers f  ON f.id = p.farmer_id
     WHERE oi.order_id IN (?)`, [ids]
  );
  orders.forEach((o) => { o.items = items.filter((i) => i.order_id === o.id); });
  return orders;
}

// GET /api/orders/mine   (buyer's own orders)
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE buyer_id = ? ORDER BY id DESC', [req.user.id]);
    res.json(await attachItems(orders));
  } catch (err) { next(err); }
});

// GET /api/orders/farmer   (orders that include this farmer's products)
router.get('/farmer', requireAuth, requireRole('farmer'), async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT o.id, o.status, o.created_at, o.delivery_address, u.full_name AS buyer,
              p.name AS product, p.unit, oi.quantity, oi.unit_price
       FROM orders o
       JOIN users u        ON u.id = o.buyer_id
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p     ON p.id = oi.product_id
       JOIN farmers f      ON f.id = p.farmer_id
       WHERE f.user_id = ?
       ORDER BY o.id DESC`, [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// PATCH /api/orders/:id/status   body: { status }
router.patch('/:id/status', requireAuth, requireRole('farmer', 'admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    // A farmer may only change orders that contain their own products
    if (req.user.role === 'farmer') {
      const [own] = await db.query(
        `SELECT oi.id FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         JOIN farmers f ON f.id = p.farmer_id
         WHERE oi.order_id = ? AND f.user_id = ? LIMIT 1`, [req.params.id, req.user.id]
      );
      if (!own.length) return res.status(403).json({ error: 'This order has none of your products.' });
    }
    const [result] = await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Order not found.' });
    res.json({ message: 'Order updated.' });
  } catch (err) { next(err); }
});

module.exports = router;
