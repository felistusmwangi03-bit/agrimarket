// Admin-only pages
const express = require('express');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(requireAuth, requireRole('admin'));

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const [[u]] = await db.query("SELECT COUNT(*) AS n FROM users WHERE role = 'buyer'");
    const [[f]] = await db.query('SELECT COUNT(*) AS n FROM farmers');
    const [[p]] = await db.query('SELECT COUNT(*) AS n FROM products WHERE is_active = 1');
    const [[o]] = await db.query("SELECT COUNT(*) AS n, COALESCE(SUM(total_amount),0) AS revenue FROM orders WHERE status <> 'cancelled'");
    res.json({ buyers: u.n, farmers: f.n, products: p.n, orders: o.n, revenue: Number(o.revenue) });
  } catch (err) { next(err); }
});

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id, full_name, email, role, phone, created_at FROM users ORDER BY id DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

// DELETE /api/admin/users/:id   (cannot delete yourself)
router.delete('/users/:id', async (req, res, next) => {
  try {
    if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account.' });
    const [orders] = await db.query('SELECT id FROM orders WHERE buyer_id = ? LIMIT 1', [req.params.id]);
    if (orders.length) return res.status(400).json({ error: 'This user has orders and cannot be deleted.' });
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted.' });
  } catch (err) { next(err); }
});

// GET /api/admin/orders
router.get('/orders', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT o.id, o.total_amount, o.status, o.created_at, u.full_name AS buyer
       FROM orders o JOIN users u ON u.id = o.buyer_id ORDER BY o.id DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// PATCH /api/admin/farmers/:id/verify   body: { verified: true|false }
router.patch('/farmers/:id/verify', async (req, res, next) => {
  try {
    await db.query('UPDATE farmers SET verified = ? WHERE id = ?', [req.body.verified ? 1 : 0, req.params.id]);
    res.json({ message: 'Farmer updated.' });
  } catch (err) { next(err); }
});

// GET /api/admin/messages
router.get('/messages', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM contact_messages ORDER BY id DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
