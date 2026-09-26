export const ANIMAL_EXPORT_COLUMNS = [
  { label: 'Nombre común', key: 'nombreComun', width: 20 },
  { label: 'Nombre científico', key: 'nombreCientifico', width: 24 },
  { label: 'Clase', key: 'clase', width: 14 },
  { label: 'Hábitat', key: 'habitat', width: 18 },
  { label: 'Dieta', key: 'dieta', width: 14 },
  { label: 'Peso promedio (kg)', key: 'pesoPromedioKg', width: 18 },
  { label: 'Esperanza de vida (años)', key: 'esperanzaVidaAnios', width: 24 },
  { label: 'Continente', key: 'continente', width: 16 },
  { label: 'En peligro de extinción', key: 'enPeligroExtincion', width: 26 },
];

export function getAnimalExportValue(animal, key) {
  return key === 'enPeligroExtincion'
    ? (animal[key] ? 'Sí' : 'No')
    : animal[key];
}
