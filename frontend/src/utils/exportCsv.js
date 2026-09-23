const CSV_COLUMNS = [
  ['Nombre común', 'nombreComun'],
  ['Nombre científico', 'nombreCientifico'],
  ['Clase', 'clase'],
  ['Hábitat', 'habitat'],
  ['Dieta', 'dieta'],
  ['Peso promedio (kg)', 'pesoPromedioKg'],
  ['Esperanza de vida (años)', 'esperanzaVidaAnios'],
  ['Continente', 'continente'],
  ['En peligro de extinción', 'enPeligroExtincion'],
];

function escapeCsvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  text = text.replace(/"/g, '""');
  return /[",\r\n]/.test(text) ? `"${text}"` : text;
}

export function animalsToCsv(animals) {
  const headers = CSV_COLUMNS.map(([label]) => escapeCsvCell(label)).join(',');
  const rows = animals.map((animal) => CSV_COLUMNS.map(([, key]) => {
    const value = key === 'enPeligroExtincion'
      ? (animal[key] ? 'Sí' : 'No')
      : animal[key];
    return escapeCsvCell(value);
  }).join(','));

  return `\uFEFFsep=,\r\n${[headers, ...rows].join('\r\n')}\r\n`;
}

export function downloadAnimalsCsv(animals, date = new Date()) {
  if (!animals.length) return false;

  const datePart = date.toISOString().slice(0, 10);
  const blob = new Blob([animalsToCsv(animals)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `animales-filtrados-${datePart}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}
