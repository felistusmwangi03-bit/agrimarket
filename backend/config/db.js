// Database connection (a "pool" re-uses connections so the app stays fast)
const mysql = require('mysql2/promise');
require('dotenv').config();

// Cloud databases (Aiven, TiDB, ...) need an encrypted connection: set DB_SSL=true in the environment.
// Optional: DB_SSL_CA = the provider's CA certificate text, to also verify the server.
const ssl = process.env.DB_SSL === 'true'
  ? (process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') } : { rejectUnauthorized: false })
  : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agrimarket',
  ssl,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
