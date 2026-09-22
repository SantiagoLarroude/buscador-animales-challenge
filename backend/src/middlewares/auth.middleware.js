const jwt = require('jsonwebtoken');

// Secret for JWT (fallback for development)
const JWT_SECRET = process.env.JWT_SECRET || 'secret_dev_key';

/** Middleware to verify JWT token */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido o expirado.' });
    }
    req.user = user; // Attach user info if needed
    next();
  });
}

module.exports = { authenticateToken, JWT_SECRET };

