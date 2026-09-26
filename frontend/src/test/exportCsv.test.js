import { afterEach, describe, expect, test, vi } from 'vitest';
import { animalsToCsv, downloadAnimalsCsv } from '../utils/exportCsv.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('animalsToCsv', () => {
  test('genera CSV UTF-8 con encabezados, acentos, orden y escape', () => {
    const csv = animalsToCsv([
      {
        nombreComun: 'Ñandú, grande',
        nombreCientifico: 'Rhea "americana"',
        clase: 'Ave',
        habitat: 'Pradera',
        dieta: 'Omnívoro',
        pesoPromedioKg: 25,
        esperanzaVidaAnios: 15,
        continente: 'América',
        enPeligroExtincion: false,
      },
    ]);

    expect(csv.startsWith('\uFEFFNombre común,Nombre científico')).toBe(true);
    expect(csv.split('\r\n')[0]).toBe('\uFEFFNombre común,Nombre científico,Clase,Hábitat,Dieta,Peso promedio (kg),Esperanza de vida (años),Continente,En peligro de extinción');
    expect(csv).toContain('Nombre común,Nombre científico');
    expect(csv).toContain('"Ñandú, grande"');
    expect(csv).toContain('"Rhea ""americana"""');
    expect(csv).toContain(',América,No\r\n');
  });

  test('descarga el archivo con nombre fechado y libera la URL temporal', () => {
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:csv-test');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    let downloaded;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click() {
      downloaded = { href: this.href, name: this.download };
    });

    const result = downloadAnimalsCsv([{
      nombreComun: 'Ñandú',
      nombreCientifico: 'Rhea americana',
      clase: 'Ave',
      habitat: 'Pradera',
      dieta: 'Omnívoro',
      pesoPromedioKg: 25,
      esperanzaVidaAnios: 15,
      continente: 'América',
      enPeligroExtincion: false,
    }], new Date('2026-09-23T12:00:00Z'));

    expect(result).toBe(true);
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(downloaded).toEqual({
      href: 'blob:csv-test',
      name: 'animales-filtrados-2026-09-23.csv',
    });
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:csv-test');
  });

  test('no inicia una descarga cuando no hay resultados', () => {
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:unused');

    expect(downloadAnimalsCsv([])).toBe(false);
    expect(createObjectUrl).not.toHaveBeenCalled();
  });
});
