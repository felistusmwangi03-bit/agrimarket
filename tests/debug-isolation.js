// D7: what the ORIGINAL login handler did with an object email
try { ({ $ne: '' }).trim(); } catch (e) { console.log('D7 original ->', e.constructor.name + ': ' + e.message); }
// D1: original duplicate check text vs stored text
const raw = ' A@TEST.co.ke ', stored = 'a@test.co.ke';
console.log('D1 original check compares', JSON.stringify(raw), '===', JSON.stringify(stored), '->', raw === stored, '(so no 409; MySQL UNIQUE then fails)');
console.log('D1 fixed   check compares', JSON.stringify(raw.trim().toLowerCase()), '===', JSON.stringify(stored), '->', raw.trim().toLowerCase() === stored);
// D2: original per-line stock check vs merged
const stock = 5, lines = [{ product_id: 2, quantity: 5 }, { product_id: 2, quantity: 5 }];
let ok = 0; for (const l of lines) if (stock >= l.quantity) ok++;
console.log('D2 original: lines accepted =', ok, 'of 2, stock after =', stock - 5 - 5);
const m = new Map(); for (const l of lines) m.set(l.product_id, (m.get(l.product_id) || 0) + l.quantity);
console.log('D2 fixed: merged quantity =', [...m.values()][0], '> stock', stock, '-> rejected =', [...m.values()][0] > stock);
// D5 / D6: rules
const pw = (p) => p.length >= 8 && /[A-Za-z]/.test(p) && /[0-9]/.test(p);
console.log('D5 123456 ->', pw('123456'), '| Passw0rd123 ->', pw('Passw0rd123'));
const ph = (p) => /^[0-9+\s-]{7,20}$/.test(p);
console.log('D6 "abc" ->', ph('abc'), '| "0712 345 678" ->', ph('0712 345 678'), '| "+254712345678" ->', ph('+254712345678'));
