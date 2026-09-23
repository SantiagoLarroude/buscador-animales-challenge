import { describe, expect, test } from 'vitest';
import { animalsToCsv } from '../utils/exportCsv.js';

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

    expect(csv.startsWith('\uFEFFsep=,\r\n')).toBe(true);
    expect(csv).toContain('Nombre común,Nombre científico');
    expect(csv).toContain('"Ñandú, grande"');
    expect(csv).toContain('"Rhea ""americana"""');
    expect(csv).toContain(',América,No\r\n');
  });
});
