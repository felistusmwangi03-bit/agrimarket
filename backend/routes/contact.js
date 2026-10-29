// Contact page messages
const express = require('express');
const db = require('../config/db');
const router = express.Router();

// POST /api/contact   body: { name, email, subject?, message }
router.post('/', async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Name, email and message are required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    await db.query('INSERT INTO contact_messages (name, email, subject, message) VALUES (?,?,?,?)',
      [name.trim(), email.trim(), subject || null, message.trim()]);
    res.status(201).json({ message: 'Thank you! We will reply soon.' });
  } catch (err) { next(err); }
});

module.exports = router;
