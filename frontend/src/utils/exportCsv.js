import { ANIMAL_EXPORT_COLUMNS, getAnimalExportValue } from './animalExport.js';

function escapeCsvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  text = text.replace(/"/g, '""');
  return /[",\r\n]/.test(text) ? `"${text}"` : text;
}

export function animalsToCsv(animals) {
  const headers = ANIMAL_EXPORT_COLUMNS.map(({ label }) => escapeCsvCell(label)).join(',');
  const rows = animals.map((animal) => ANIMAL_EXPORT_COLUMNS.map(({ key }) =>
    escapeCsvCell(getAnimalExportValue(animal, key))
  ).join(','));

  return `\uFEFF${[headers, ...rows].join('\r\n')}\r\n`;
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
