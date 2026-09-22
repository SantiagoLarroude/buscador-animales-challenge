const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getUsers, saveUsers } = require('../utils/db');
const { JWT_SECRET } = require('../middlewares/auth.middleware');

// Regex simple para validar email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Registro de nuevos usuarios.
 */
async function signup(req, res) {
  try {
    const { email, password } = req.body;

    // 1. Validaciones básicas
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Proporcione un email con formato válido.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    // 2. Verificar que el email no esté registrado
    const users = await getUsers();
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      return res.status(400).json({ message: 'El email ya se encuentra registrado.' });
    }

    // 3. Hashear la contraseña antes de guardar
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Crear y persistir nuevo usuario
    const newUser = {
      id: Date.now(),
      email: email.toLowerCase(),
      passwordHash,
    };

    users.push(newUser);
    await saveUsers(users);

    return res.status(201).json({ message: 'Usuario registrado correctamente.' });
  } catch (error) {
    console.error('Error en signup:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

/**
 * Inicio de sesión y entrega de JWT.
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    }

    const users = await getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    // Si el usuario no existe, devolvemos 401 genérico
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // Comparar la contraseña ingresada con el hash guardado
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    // Si la contraseña no coincide, devolvemos 401 genérico
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // Generar el token JWT (expira en 2 horas)
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({
      message: 'Login exitoso.',
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

module.exports = {
  signup,
  login,
};