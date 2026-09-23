const { getAnimals } = require('../utils/db');

function getOptionalString(query, key) {
  const value = query[key];
  if (value === undefined || value === '') return '';
  if (typeof value !== 'string') {
    throw new TypeError(`El parámetro ${key} debe aparecer una sola vez.`);
  }
  return value.trim();
}

function getOptionalWeight(query, key) {
  const value = getOptionalString(query, key);
  if (value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new TypeError(`El parámetro ${key} debe ser un número mayor o igual a 0.`);
  }
  return parsed;
}

/**
 * Obtener listado de animales filtrado por query params.
 */
async function getFilteredAnimals(req, res) {
  try {
    const nombre = getOptionalString(req.query, 'nombre');
    const clase = getOptionalString(req.query, 'clase');
    const dieta = getOptionalString(req.query, 'dieta');
    const continente = getOptionalString(req.query, 'continente');
    const pesoMin = getOptionalWeight(req.query, 'pesoMin');
    const pesoMax = getOptionalWeight(req.query, 'pesoMax');
    const enPeligro = getOptionalString(req.query, 'enPeligro').toLowerCase();

    if (pesoMin !== null && pesoMax !== null && pesoMin > pesoMax) {
      return res.status(400).json({ message: 'pesoMin no puede ser mayor que pesoMax.' });
    }

    if (enPeligro && !['true', 'false'].includes(enPeligro)) {
      return res.status(400).json({ message: 'enPeligro debe ser true o false.' });
    }

    let animals = await getAnimals();

    // Filtro parcial por nombre común
    if (nombre) {
      const search = nombre.toLowerCase();
      animals = animals.filter(a => a.nombreComun.toLowerCase().includes(search));
    }

    // Filtro exacto por clase
    if (clase) {
      animals = animals.filter(a => a.clase.toLowerCase() === clase.toLowerCase());
    }

    // Filtro exacto por dieta
    if (dieta) {
      animals = animals.filter(a => a.dieta.toLowerCase() === dieta.toLowerCase());
    }

    // Filtro exacto por continente
    if (continente) {
      animals = animals.filter(a => a.continente.toLowerCase() === continente.toLowerCase());
    }

    // Filtro por rango de peso (mínimo)
    if (pesoMin !== null) {
      animals = animals.filter(a => a.pesoPromedioKg >= pesoMin);
    }

    // Filtro por rango de peso (máximo)
    if (pesoMax !== null) {
      animals = animals.filter(a => a.pesoPromedioKg <= pesoMax);
    }

    // Filtro por estado de peligro de extinción
    if (enPeligro) {
      const isEnPeligro = enPeligro === 'true';
      animals = animals.filter(a => a.enPeligroExtincion === isEnPeligro);
    }

    return res.json(animals);
  } catch (error) {
    if (error instanceof TypeError) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error al obtener animales:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

module.exports = {
  getFilteredAnimals,
};
