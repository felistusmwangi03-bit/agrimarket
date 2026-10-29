// Public farmer pages
const express = require('express');
const db = require('../config/db');
const router = express.Router();

// GET /api/farmers  (all farms with how many products they sell)
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT f.id, f.farm_name, f.location, f.description, f.verified, u.full_name AS owner,
              COUNT(p.id) AS product_count
       FROM farmers f
       JOIN users u ON u.id = f.user_id
       LEFT JOIN products p ON p.farmer_id = f.id AND p.is_active = 1
       GROUP BY f.id, f.farm_name, f.location, f.description, f.verified, u.full_name
       ORDER BY f.farm_name`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/farmers/:id  (one farm and its products)
router.get('/:id', async (req, res, next) => {
  try {
    const [farm] = await db.query(
      `SELECT f.id, f.farm_name, f.location, f.description, f.verified, u.full_name AS owner
       FROM farmers f JOIN users u ON u.id = f.user_id WHERE f.id = ?`, [req.params.id]
    );
    if (!farm.length) return res.status(404).json({ error: 'Farm not found.' });
    const [products] = await db.query(
      `SELECT id, name, price, unit, badge, icon FROM products WHERE farmer_id = ? AND is_active = 1`, [req.params.id]
    );
    res.json({ ...farm[0], products });
  } catch (err) { next(err); }
});

module.exports = router;
