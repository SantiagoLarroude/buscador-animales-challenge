import { ANIMAL_EXPORT_COLUMNS, getAnimalExportValue } from './animalExport.js';

const HEADER_STYLE = {
  fontWeight: 'bold',
  textColor: '#FFFFFF',
  backgroundColor: '#166534',
  align: 'center',
  alignVertical: 'center',
  wrap: true,
  height: 32,
  bottomBorderColor: '#14532D',
  bottomBorderStyle: 'medium',
};

export function animalsToXlsxData(animals) {
  const headers = ANIMAL_EXPORT_COLUMNS.map(({ label }) => ({
    value: label,
    ...HEADER_STYLE,
  }));

  const rows = animals.map((animal) => ANIMAL_EXPORT_COLUMNS.map(({ key }) => ({
    value: getAnimalExportValue(animal, key),
    align: ['pesoPromedioKg', 'esperanzaVidaAnios'].includes(key) ? 'right' : 'left',
    alignVertical: 'center',
  })));

  return [headers, ...rows];
}

export async function createAnimalsXlsxBlob(animals) {
  const { default: writeExcelFile } = await import('write-excel-file/universal');
  const writer = writeExcelFile(
    animalsToXlsxData(animals),
    {
      sheet: 'Animales',
      columns: ANIMAL_EXPORT_COLUMNS.map(({ width }) => ({ width })),
      stickyRowsCount: 1,
      orientation: 'landscape',
      zoomScale: 0.9,
    },
    {
      fontFamily: 'Arial',
      fontSize: 11,
    }
  );

  return writer.toBlob();
}

export async function downloadAnimalsXlsx(
  animals,
  date = new Date(),
  createBlob = createAnimalsXlsxBlob
) {
  if (!animals.length) return false;

  const blob = await createBlob(animals);
  const datePart = date.toISOString().slice(0, 10);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `animales-filtrados-${datePart}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}
