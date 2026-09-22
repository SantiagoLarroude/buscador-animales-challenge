const { Router } = require('express');
const { getFilteredAnimals } = require('../controllers/animals.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = Router();

// GET /api/animales (Protegido por JWT)
router.get('/', authenticateToken, getFilteredAnimals);

module.exports = router;