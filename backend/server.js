require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/auth.routes');
const animalsRoutes = require('./src/routes/animals.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
}));
app.use(express.json({ limit: '10kb' }));

// Registro de rutas API
app.use('/api/auth', authRoutes);
app.use('/api/animales', animalsRoutes);

// Ruta de chequeo de estado (Health Check)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor Express corriendo correctamente' });
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ message: 'El cuerpo de la solicitud no contiene JSON válido.' });
  }

  return next(error);
});

// Manejador genérico para rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

app.use((error, req, res, next) => {
  console.error('Error no controlado:', error);
  return res.status(500).json({ message: 'Error interno del servidor.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor iniciado y escuchando en http://localhost:${PORT}`);
  });
}

module.exports = app;
