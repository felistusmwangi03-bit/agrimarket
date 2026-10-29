// AgriMarket automated tests.  Usage (server must be running):  node tests/run-tests.js [baseUrl]
// Needs Node 18+. Writes tests/results.md that you can paste into your report.
const fs = require('fs');
const BASE = process.argv[2] || 'http://localhost:3000';
const results = [];
async function call(method, path, body, token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = 'Bearer ' + token;
  const r = await fetch(BASE + '/api' + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  let j = {}; try { j = await r.json(); } catch (e) {}
  return { status: r.status, body: j };
}
function check(id, desc, expected, actual, pass) {
  results.push({ id, desc, expected, actual, status: pass ? 'PASS' : 'FAIL' });
  console.log((pass ? 'PASS ' : 'FAIL ') + id + ' ' + desc + '  [' + actual + ']');
}
const uniq = Date.now();
(async () => {
  // ---- Registration ----
  let r = await call('POST', '/auth/register', { full_name: 'Test Buyer', email: `t${uniq}@test.co.ke`, password: 'Passw0rd123', confirm_password: 'Passw0rd123', role: 'buyer' });
  check('REG-01', 'Valid buyer registration', '201 + token', r.status, r.status === 201 && !!r.body.token);
  r = await call('POST', '/auth/register', { full_name: 'Test Buyer', email: `t${uniq}@test.co.ke`, password: 'Passw0rd123', confirm_password: 'Passw0rd123' });
  check('REG-02', 'Duplicate email rejected', '409', r.status, r.status === 409);
  r = await call('POST', '/auth/register', { full_name: 'Test Buyer', email: ` T${uniq}@TEST.co.ke `, password: 'Passw0rd123', confirm_password: 'Passw0rd123' });
  check('REG-03', 'Duplicate email with capitals/spaces rejected (was defect D1)', '409', r.status, r.status === 409);
  r = await call('POST', '/auth/register', { full_name: 'X', email: 'not-an-email', password: 'Passw0rd123', confirm_password: 'Passw0rd123' });
  check('REG-04', 'Invalid email rejected', '400', r.status, r.status === 400);
  r = await call('POST', '/auth/register', { full_name: 'X', email: `a${uniq}@t.co`, password: 'Passw0rd123', confirm_password: 'Different1' });
  check('REG-05', 'Password mismatch rejected', '400', r.status, r.status === 400);
  r = await call('POST', '/auth/register', { full_name: 'X', email: `b${uniq}@t.co`, password: '123456', confirm_password: '123456' });
  check('REG-06', 'Weak password rejected (was defect D5)', '400', r.status, r.status === 400);
  r = await call('POST', '/auth/register', { full_name: 'X', email: `c${uniq}@t.co`, password: 'Passw0rd123', confirm_password: 'Passw0rd123', role: 'admin' });
  check('SEC-05', 'Cannot self-register as admin', 'role = buyer', r.body.user && r.body.user.role, r.status === 201 && r.body.user.role === 'buyer');
  // ---- Login / security ----
  r = await call('POST', '/auth/login', { email: 'buyer@agrimarket.co.ke', password: 'Password123' });
  check('LOG-01', 'Valid login', '200 + token', r.status, r.status === 200 && !!r.body.token);
  const token = r.body.token;
  r = await call('POST', '/auth/login', { email: 'buyer@agrimarket.co.ke', password: 'wrong' });
  check('LOG-02', 'Wrong password', '401', r.status, r.status === 401);
  r = await call('POST', '/auth/login', { email: '', password: '' });
  check('LOG-03', 'Empty fields', '400', r.status, r.status === 400);
  r = await call('POST', '/auth/login', { email: "' OR '1'='1", password: "' OR '1'='1" });
  check('SEC-01', "SQL injection ' OR '1'='1 in login", '401 (no login)', r.status, r.status === 401);
  r = await call('POST', '/auth/login', { email: "admin@agrimarket.co.ke'; DROP TABLE users;--", password: 'x' });
  check('SEC-02', 'SQL injection with DROP TABLE', '401, tables intact', r.status, r.status === 401);
  r = await call('POST', '/auth/login', { email: { $ne: '' }, password: { $ne: '' } });
  check('SEC-03', 'Object instead of text (type confusion)', '400/401, no crash', r.status, [400, 401].includes(r.status));
  r = await call('GET', '/auth/me');
  check('SEC-04', 'Protected route without token', '401', r.status, r.status === 401);
  r = await call('GET', '/auth/me', null, 'garbage.token.value');
  check('SEC-06', 'Invalid token', '401', r.status, r.status === 401);
  r = await call('GET', '/admin/users', null, token);
  check('SEC-07', 'Buyer cannot use admin API', '403', r.status, r.status === 403);
  // ---- Catalogue ----
  r = await call('GET', '/products');
  check('CAT-01', 'Product list loads', '200 + 8 products (fresh sample data)', r.status + ' / ' + (r.body.length ?? '?'), r.status === 200 && Array.isArray(r.body) && r.body.length >= 8);
  r = await call('GET', '/products?search=tomato');
  check('CAT-02', 'Search "tomato"', 'only tomato products', r.body.length, r.status === 200 && r.body.length >= 1 && r.body.every((p) => /tomato/i.test(p.name + p.farm_name)));
  r = await call('GET', '/products?category=2');
  check('CAT-03', 'Filter by category 2 (Fruits)', 'all category_id = 2', r.body.length, r.status === 200 && r.body.every((p) => p.category_id === 2));
  r = await call('GET', '/products?sort=price_asc');
  check('CAT-04', 'Sort price ascending', 'ascending prices', r.status, r.status === 200 && r.body.every((p, i, a) => !i || Number(a[i - 1].price) <= Number(p.price)));
  r = await call('GET', '/products?search=zzzzzz');
  check('CAT-05', 'Search with no match', '200 + empty list', r.status + ' / ' + r.body.length, r.status === 200 && r.body.length === 0);
  r = await call('GET', '/products/999999');
  check('CAT-06', 'Unknown product id', '404', r.status, r.status === 404);
  r = await call('GET', "/products?search=' OR 1=1 --");
  check('SEC-08', 'SQL injection in catalogue search', '200 + empty list', r.status + ' / ' + r.body.length, r.status === 200 && r.body.length === 0);
  // ---- Checkout ----
  const order = (items, extra = {}) => call('POST', '/orders', { items, delivery_address: 'Kilimani, Nairobi', phone: '0712345678', payment_method: 'cash', ...extra }, token);
  r = await call('POST', '/orders', { items: [{ product_id: 1, quantity: 1 }], delivery_address: 'x', phone: '0712345678' });
  check('CHK-01', 'Checkout without login', '401', r.status, r.status === 401);
  r = await order([{ product_id: 2, quantity: 2 }]);
  check('CHK-02', 'Valid order (2 x Sukuma Wiki 35 + 100 delivery)', '201, total 170', r.status + ' / ' + r.body.total, r.status === 201 && Number(r.body.total) === 170);
  r = await order([]);
  check('CHK-03', 'Empty cart', '400', r.status, r.status === 400);
  r = await order([{ product_id: 2, quantity: 0 }]);
  check('CHK-04', 'Quantity 0 (boundary)', '400', r.status, r.status === 400);
  r = await order([{ product_id: 2, quantity: 999999 }]);
  check('CHK-05', 'Quantity above stock (boundary)', '400 "Only N left"', r.status, r.status === 400);
  r = await order([{ product_id: 999999, quantity: 1 }]);
  check('CHK-06', 'Unknown product', '400', r.status, r.status === 400);
  r = await order([{ product_id: 2, quantity: 1 }], { phone: 'abc' });
  check('CHK-07', 'Invalid phone (was defect D6)', '400', r.status, r.status === 400);
  r = await call('GET', '/products/2'); const stock = r.body.stock_qty;
  r = await order([{ product_id: 2, quantity: stock }, { product_id: 2, quantity: stock }]);
  check('CHK-08', 'Same product twice must not oversell (was defect D2)', '400', r.status, r.status === 400);
  r = await call('GET', '/products/2');
  check('CHK-09', 'Stock never negative', 'stock >= 0', r.body.stock_qty, r.body.stock_qty >= 0);
  // ---- report ----
  const pass = results.filter((x) => x.status === 'PASS').length;
  let md = `# AgriMarket test results\n\nRun: ${new Date().toISOString()}  |  Server: ${BASE}\n\nPassed ${pass} of ${results.length}\n\n| ID | Test | Expected | Actual | Status |\n|---|---|---|---|---|\n`;
  md += results.map((x) => `| ${x.id} | ${x.desc} | ${x.expected} | ${x.actual} | ${x.status} |`).join('\n') + '\n';
  fs.writeFileSync(__dirname + '/results.md', md);
  console.log(`\n${pass}/${results.length} passed. Saved tests/results.md`);
})().catch((e) => { console.error('Could not run tests - is the server running?', e.message); process.exit(1); });
