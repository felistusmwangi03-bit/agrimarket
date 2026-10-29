/* AgriMarket shared code: API helper, login session, cart, header, footer */

// If you open the HTML files by double-clicking, talk to the server on port 3000.
// Set API_BASE if the website and the server are on different addresses
// (e.g. Live Server on :5500 or a separate host). Leave '' when the server serves the site.
const API_BASE = '';   // e.g. 'https://your-server.example.com'
const API = API_BASE ? API_BASE + '/api'
  : (location.protocol === 'file:' || (location.port && location.port !== '3000' && location.hostname === 'localhost'))
    ? 'http://localhost:3000/api' : '/api';

// ---------- small helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const money = (n) => 'KSh ' + Number(n).toLocaleString('en-KE', { maximumFractionDigits: 0 });
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tint = (id) => 'tint-' + ((Number(id) || 0) % 4);

function toast(msg) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2200);
}

function showMsg(el, text, type = 'error') {
  el.className = 'form-msg ' + type;
  el.textContent = text;
}

// ---------- API ----------
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('agri_token');
  if (token) headers.Authorization = 'Bearer ' + token;
  let res;
  try {
    res = await fetch(API + path, { ...options, headers, body: options.body ? JSON.stringify(options.body) : undefined });
  } catch (e) {
    throw new Error('Cannot reach the server. Is it running? (npm start)');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) logout(false);
    throw new Error(data.error || 'Something went wrong.');
  }
  return data;
}

// ---------- login session ----------
function getUser() {
  try { return JSON.parse(localStorage.getItem('agri_user')); } catch (e) { return null; }
}
function setSession(token, user) {
  localStorage.setItem('agri_token', token);
  localStorage.setItem('agri_user', JSON.stringify(user));
}
function logout(redirect = true) {
  localStorage.removeItem('agri_token');
  localStorage.removeItem('agri_user');
  if (redirect) location.href = 'index.html';
}
// Send the visitor away unless they have one of the allowed roles
function guard(...roles) {
  const u = getUser();
  if (!u) { location.href = 'login.html?next=' + encodeURIComponent(location.pathname.split('/').pop()); return null; }
  if (roles.length && !roles.includes(u.role)) { location.href = 'index.html'; return null; }
  return u;
}
function homeFor(user) {
  return { admin: 'admin.html', farmer: 'farmer-dashboard.html', buyer: 'catalogue.html' }[user.role];
}

// ---------- cart (kept in the browser) ----------
const Cart = {
  get() { try { return JSON.parse(localStorage.getItem('agri_cart')) || []; } catch (e) { return []; } },
  save(items) { localStorage.setItem('agri_cart', JSON.stringify(items)); updateBadge(); },
  add(p, qty = 1) {
    const items = this.get();
    const found = items.find((i) => i.id === p.id);
    if (found) found.qty += qty;
    else items.push({ id: p.id, name: p.name, price: Number(p.price), unit: p.unit, icon: p.icon, farm_name: p.farm_name, category_id: p.category_id, qty });
    this.save(items);
    toast(`${p.name} added to cart`);
  },
  setQty(id, qty) {
    let items = this.get();
    if (qty < 1) items = items.filter((i) => i.id !== id);
    else items.find((i) => i.id === id).qty = qty;
    this.save(items);
  },
  remove(id) { this.save(this.get().filter((i) => i.id !== id)); },
  clear() { this.save([]); },
  count() { return this.get().reduce((n, i) => n + i.qty, 0); },
  subtotal() { return this.get().reduce((n, i) => n + i.price * i.qty, 0); }
};
const DELIVERY_FEE = 100;
function updateBadge() { $$('.cart-count').forEach((el) => (el.textContent = Cart.count())); }

// ---------- header & footer ----------
function renderHeader(active) {
  const u = getUser();
  const link = (href, label, key) => `<a href="${href}" class="${active === key ? 'active' : ''}">${label}</a>`;
  let auth;
  if (!u) auth = link('login.html', 'Login / Register', 'login');
  else {
    const mine = u.role === 'admin' ? link('admin.html', 'Admin', 'admin')
      : u.role === 'farmer' ? link('farmer-dashboard.html', 'My farm', 'dash')
      : link('orders.html', 'My orders', 'orders');
    auth = `${mine}<button class="btn-link" onclick="logout()">Logout (${esc(u.full_name.split(' ')[0])})</button>`;
  }
  $('#site-header').innerHTML = `
    <header class="site-header"><div class="container nav">
      <a class="logo" href="index.html"><span class="mark">🌿</span> AgriMarket</a>
      <button class="nav-toggle" aria-label="Menu" onclick="$('.nav-links').classList.toggle('open')">☰</button>
      <nav class="nav-links">
        ${link('index.html', 'Home', 'home')}
        ${link('catalogue.html', 'Produce Catalogue', 'catalogue')}
        ${link('about.html', 'About us', 'about')}
        ${link('contact.html', 'Contact', 'contact')}
        ${auth}
        <a class="cart-link ${active === 'cart' ? 'active' : ''}" href="cart.html">Cart <span class="badge-count cart-count">0</span></a>
      </nav>
    </div></header>`;
  updateBadge();
}

function renderFooter() {
  $('#site-footer').innerHTML = `
    <footer class="site-footer"><div class="container foot">
      <a class="logo" href="index.html"><span class="mark">🌿</span> AgriMarket</a>
      <div>
        <div>Connecting farmers and buyers, one harvest at a time.</div>
        <div class="foot-links" style="margin-top:.5rem">
          <a href="about.html">About us</a><a href="farmers.html">Our farmers</a><a href="contact.html">Contact</a><a href="catalogue.html">Catalogue</a>
        </div>
      </div>
      <div>© 2026 AgriMarket</div>
    </div></footer>`;
}

// ---------- product card used on Home and Catalogue ----------
function productCard(p) {
  return `
  <article class="product-card">
    <a href="product.html?id=${p.id}" aria-label="${esc(p.name)}">
      <div class="thumb ${tint(p.category_id)}">
        ${p.badge ? `<span class="tag">${esc(p.badge)}</span>` : ''}
        <span>${esc(p.icon || '🌱')}</span>
      </div>
    </a>
    <div class="body">
      <h3><a href="product.html?id=${p.id}">${esc(p.name)}</a></h3>
      <span class="farm">⌂ ${esc(p.farm_name)}</span>
      <div class="buy">
        <span class="price">${money(p.price)} <small>/ ${esc(p.unit)}</small></span>
        <button class="add-btn" aria-label="Add ${esc(p.name)} to cart" onclick='addFromCard(${p.id})'>+</button>
      </div>
    </div>
  </article>`;
}
// Cards keep their product data here so the "+" button can find it
window.PRODUCT_CACHE = {};
function cacheProducts(list) { list.forEach((p) => (PRODUCT_CACHE[p.id] = p)); }
function addFromCard(id) { Cart.add(PRODUCT_CACHE[id]); }

function statusPill(s) {
  const cls = s === 'delivered' || s === 'confirmed' ? '' : s === 'cancelled' ? 'bad' : 'warn';
  return `<span class="pill ${cls}">${esc(s)}</span>`;
}
function fmtDate(d) { return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }); }

// Every page calls this once
function initPage(active) {
  renderHeader(active);
  renderFooter();
}
