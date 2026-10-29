// Login protection for the API
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET;
if (!SECRET) { console.error('JWT_SECRET is missing in backend/.env - set it and restart.'); process.exit(1); }  // FIX: no insecure default

// Make a token that the browser keeps after login
function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.full_name }, SECRET, { expiresIn: '7d' });
}

// Block the request unless a valid token is sent: Authorization: Bearer <token>
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in first.' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Your session expired. Please log in again.' });
  }
}

// Allow only certain roles, e.g. requireRole('farmer', 'admin')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You are not allowed to do this.' });
    }
    next();
  };
}

module.exports = { signToken, requireAuth, requireRole };
