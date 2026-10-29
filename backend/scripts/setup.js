// Run with:  npm run setup
// 1) creates the database and tables from database/schema.sql
// 2) adds sample users, farms, categories and the 8 products from the wireframes
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

(async () => {
  // Local XAMPP: creates the database itself.  Cloud MySQL: set DB_SKIP_CREATE=true (the provider
  // already gave you a database) and DB_SSL=true.
  const skipCreate = process.env.DB_SKIP_CREATE === 'true';
  const ssl = process.env.DB_SSL === 'true'
    ? (process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') } : { rejectUnauthorized: false })
    : undefined;
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    ssl,
    database: skipCreate ? (process.env.DB_NAME || 'agrimarket') : undefined,
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    multipleStatements: true
  });

  console.log('Creating database and tables...');
  let sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
  if (skipCreate) sql = sql.replace(/^CREATE DATABASE.*$/im, '').replace(/^USE .*$/im, '');
  await conn.query(sql);
  if (!skipCreate) await conn.query('USE ' + conn.escapeId(process.env.DB_NAME || 'agrimarket'));

  console.log('Adding sample data...');
  const hash = await bcrypt.hash('Password123', 10);

  // Users: 1 admin, 1 buyer, 7 farmers
  const users = [
    ['Site Admin',     'admin@agrimarket.co.ke',       'admin',  '0700000001'],
    ['Amina Wanjiku',  'buyer@agrimarket.co.ke',       'buyer',  '0700000002'],
    ['Wanjiku Mwangi', 'wanjiku@agrimarket.co.ke',     'farmer', '0711000001'],
    ['Peter Ochieng',  'greenvalley@agrimarket.co.ke', 'farmer', '0711000002'],
    ['Grace Achieng',  'sunrise@agrimarket.co.ke',     'farmer', '0711000003'],
    ['John Kiboko',    'kiboko@agrimarket.co.ke',      'farmer', '0711000004'],
    ['Mary Mwangaza',  'mwangaza@agrimarket.co.ke',    'farmer', '0711000005'],
    ['Samuel Kamau',   'kamau@agrimarket.co.ke',       'farmer', '0711000006'],
    ['Lucy Akinyi',    'lakeview@agrimarket.co.ke',    'farmer', '0711000007']
  ];
  for (const u of users) {
    await conn.query(
      'INSERT INTO users (full_name, email, password_hash, role, phone) VALUES (?,?,?,?,?)',
      [u[0], u[1], hash, u[2], u[3]]
    );
  }

  // Farms (user ids 3..9)
  const farms = [
    [3, 'Wanjiku Farm',         'Kiambu',      'Family farm growing tomatoes and kitchen vegetables since 2009.', 1],
    [4, 'Green Valley Growers', 'Nakuru',      'A group of 40 growers producing leafy greens and peppers.', 1],
    [5, 'Sunrise Orchards',     'Machakos',    'Mango and citrus orchards in the sun-drenched Machakos hills.', 1],
    [6, 'Kiboko Family Farm',   'Makueni',     'Root crops and sweet potatoes grown with little water.', 1],
    [7, 'Mwangaza Farmers',     'Trans Nzoia', 'Cooperative of maize and cereal farmers.', 1],
    [8, 'Kamau Produce',        'Nyandarua',   'Onions, potatoes and cabbages from the highlands.', 1],
    [9, 'Lakeview Farm',        'Kisumu',      'Bananas and fruits grown near Lake Victoria.', 1]
  ];
  for (const f of farms) {
    await conn.query('INSERT INTO farmers (user_id, farm_name, location, description, verified) VALUES (?,?,?,?,?)', f);
  }

  // Categories (from the Home page wireframe)
  const cats = [
    ['Vegetables',       'Fresh from the field',       '🥬'],
    ['Fruits',           'Sweet and seasonal',         '🥭'],
    ['Grains & cereals', 'Everyday essentials',        '🌽'],
    ['Farm staples',     'Good value, locally grown',  '🥔']
  ];
  for (const c of cats) {
    await conn.query('INSERT INTO categories (name, description, icon) VALUES (?,?,?)', c);
  }

  // Products: the 8 items in the Produce catalogue wireframe
  // [farmer_id, category_id, name, description, price, unit, stock, badge, icon]
  const products = [
    [1, 1, 'Fresh Tomatoes', 'Firm, juicy tomatoes picked this morning. Great for stews and salads.', 80,  'kg',    120, 'Popular',     '🍅'],
    [2, 1, 'Sukuma Wiki',    'Tender kale leaves, washed and bundled. The Kenyan kitchen favourite.',  35,  'bunch', 200, 'Fresh today', '🥬'],
    [3, 2, 'Sweet Mangoes',  'Ripe, fibre-free mangoes from the Machakos hills.',                       120, 'kg',    80,  'Seasonal',    '🥭'],
    [4, 4, 'Sweet Potatoes', 'Orange-fleshed sweet potatoes. Filling, sweet and full of vitamins.',     65,  'kg',    150, 'Good value',  '🍠'],
    [5, 3, 'Dry Maize',      'Clean, well-dried maize ready for milling or githeri.',                   95,  'kg',    500, 'Staple',      '🌽'],
    [6, 4, 'Red Onions',     'Strong, well-cured red onions from the highlands.',                       100, 'kg',    220, 'Farm fresh',  '🧅'],
    [7, 2, 'Ripe Bananas',   'Sweet bananas from Lakeview Farm, sold by the bunch.',                    90,  'bunch', 90,  'Sweet',       '🍌'],
    [2, 1, 'Green Capsicum', 'Crisp green peppers, ideal for stir-fries and salads.',                   140, 'kg',    60,  'Fresh today', '🫑']
  ];
  for (const p of products) {
    await conn.query(
      'INSERT INTO products (farmer_id, category_id, name, description, price, unit, stock_qty, badge, icon) VALUES (?,?,?,?,?,?,?,?,?)',
      p
    );
  }

  // One sample order so "My orders" and the dashboards are not empty
  const [o] = await conn.query(
    "INSERT INTO orders (buyer_id, total_amount, status, delivery_address, phone, payment_method) VALUES (2, 380, 'confirmed', 'Kilimani, Nairobi', '0700000002', 'mpesa')"
  );
  await conn.query('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?,?,?,?)', [o.insertId, 1, 2, 80]);
  await conn.query('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?,?,?,?)', [o.insertId, 3, 1, 120]);

  console.log('\nDone! Demo logins (password for all: Password123)');
  console.log('  admin  : admin@agrimarket.co.ke');
  console.log('  buyer  : buyer@agrimarket.co.ke');
  console.log('  farmer : wanjiku@agrimarket.co.ke');
  await conn.end();
})().catch((err) => {
  console.error('Setup failed:', err.message);
  console.error('Is MySQL running (XAMPP > Start MySQL) and are the .env details correct?');
  process.exit(1);
});
