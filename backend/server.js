const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/auth.routes');
const animalsRoutes = require('./src/routes/animals.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors()); // Permite peticiones desde el frontend en React
app.use(express.json()); // Parsea bodies de peticiones en formato JSON

// Registro de rutas API
app.use('/api/auth', authRoutes);
app.use('/api/animales', animalsRoutes);

// Ruta de chequeo de estado (Health Check)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor Express corriendo correctamente' });
});

// Manejador genérico para rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor iniciado y escuchando en http://localhost:${PORT}`);
  });
}

module.exports = app;