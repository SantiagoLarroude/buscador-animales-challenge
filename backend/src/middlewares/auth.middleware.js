const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET es obligatorio. Configuralo en backend/.env antes de iniciar la API.');
}

/** Middleware to verify JWT token */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const [scheme, token] = authHeader ? authHeader.split(' ') : [];

  if (scheme !== 'Bearer' || !token) {
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
