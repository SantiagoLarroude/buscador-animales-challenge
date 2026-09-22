const { getAnimals } = require('../utils/db');

/**
 * Obtener listado de animales filtrado por query params.
 */
async function getFilteredAnimals(req, res) {
  try {
    const { nombre, clase, dieta, continente, pesoMin, pesoMax, enPeligro } = req.query;

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
    if (pesoMin) {
      const min = parseFloat(pesoMin);
      if (!isNaN(min)) {
        animals = animals.filter(a => a.pesoPromedioKg >= min);
      }
    }

    // Filtro por rango de peso (máximo)
    if (pesoMax) {
      const max = parseFloat(pesoMax);
      if (!isNaN(max)) {
        animals = animals.filter(a => a.pesoPromedioKg <= max);
      }
    }

    // Filtro por estado de peligro de extinción
    if (enPeligro !== undefined && enPeligro !== '') {
      const isEnPeligro = enPeligro === 'true';
      animals = animals.filter(a => a.enPeligroExtincion === isEnPeligro);
    }

    return res.json(animals);
  } catch (error) {
    console.error('Error al obtener animales:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

module.exports = {
  getFilteredAnimals,
};