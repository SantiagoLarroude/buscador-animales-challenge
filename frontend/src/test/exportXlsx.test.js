import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  animalsToXlsxData,
  createAnimalsXlsxBlob,
  downloadAnimalsXlsx,
} from '../utils/exportXlsx.js';

const animal = {
  nombreComun: 'Ñandú',
  nombreCientifico: 'Rhea americana',
  clase: 'Ave',
  habitat: 'Pradera',
  dieta: 'Omnívoro',
  pesoPromedioKg: 25,
  esperanzaVidaAnios: 15,
  continente: 'América',
  enPeligroExtincion: false,
};

afterEach(() => {
  vi.restoreAllMocks();
});

function readBlobAsArrayBuffer(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsArrayBuffer(blob);
  });
}

describe('exportación Excel', () => {
  test('genera encabezados en la primera fila y conserva tipos y acentos', () => {
    const data = animalsToXlsxData([animal]);

    expect(data).toHaveLength(2);
    expect(data[0].map((cell) => cell.value)).toEqual([
      'Nombre común',
      'Nombre científico',
      'Clase',
      'Hábitat',
      'Dieta',
      'Peso promedio (kg)',
      'Esperanza de vida (años)',
      'Continente',
      'En peligro de extinción',
    ]);
    expect(data[1].map((cell) => cell.value)).toEqual([
      'Ñandú',
      'Rhea americana',
      'Ave',
      'Pradera',
      'Omnívoro',
      25,
      15,
      'América',
      'No',
    ]);
  });

  test('crea un archivo XLSX real', async () => {
    const blob = await createAnimalsXlsxBlob([animal]);
    const bytes = new Uint8Array(await readBlobAsArrayBuffer(blob));

    expect(blob.size).toBeGreaterThan(1000);
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('PK\u0003\u0004');
  });

  test('descarga el archivo fechado y libera la URL temporal', async () => {
    const blob = new Blob(['xlsx-test'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const createBlob = vi.fn().mockResolvedValue(blob);
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:xlsx-test');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    let downloaded;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click() {
      downloaded = { href: this.href, name: this.download };
    });

    const result = await downloadAnimalsXlsx(
      [animal],
      new Date('2026-09-26T12:00:00Z'),
      createBlob
    );

    expect(result).toBe(true);
    expect(createBlob).toHaveBeenCalledWith([animal]);
    expect(downloaded).toEqual({
      href: 'blob:xlsx-test',
      name: 'animales-filtrados-2026-09-26.xlsx',
    });
    expect(createObjectUrl).toHaveBeenCalledWith(blob);
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:xlsx-test');
  });

  test('no genera un archivo sin resultados', async () => {
    const createBlob = vi.fn();

    expect(await downloadAnimalsXlsx([], new Date(), createBlob)).toBe(false);
    expect(createBlob).not.toHaveBeenCalled();
  });
});
