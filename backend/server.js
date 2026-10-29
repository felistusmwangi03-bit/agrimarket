// AgriMarket server: serves the API (/api/...) and the website (../frontend)
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check: open http://localhost:3000/api/health to test server + database
app.get('/api/health', async (req, res) => {
  try {
    await require('./config/db').query('SELECT 1');
    res.json({ server: 'ok', database: 'ok' });
  } catch (e) {
    res.status(500).json({ server: 'ok', database: 'FAILED', reason: e.code || e.message });
  }
});

// API routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/farmers',    require('./routes/farmers'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/contact',    require('./routes/contact'));
app.use('/api/admin',      require('./routes/admin'));

// Unknown API address
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));

// The website (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Any other error
app.use((err, req, res, next) => {
  console.error(err);
  const dbDown = ['ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ENOTFOUND', 'ER_NO_SUCH_TABLE'].includes(err.code);
  res.status(500).json({ error: dbDown ? 'Cannot reach the database (' + err.code + '). Check backend/.env and that MySQL is running.' : 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AgriMarket is running at http://localhost:${PORT}`);
});

// Keep the server alive on unexpected errors
process.on('unhandledRejection', (e) => console.error('Unhandled:', e));
