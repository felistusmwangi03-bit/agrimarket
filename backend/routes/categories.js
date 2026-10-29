// GET /api/categories
const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id, name, description, icon FROM categories ORDER BY id');
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
