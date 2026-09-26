import { describe, expect, test } from 'vitest';
import { getChipToneClass } from '../utils/chipTones.js';

describe('getChipToneClass', () => {
  test('mantiene un tono determinístico para todas las opciones de filtros', () => {
    expect([
      getChipToneClass('clase', 'Mamífero'),
      getChipToneClass('clase', 'Ave'),
      getChipToneClass('clase', 'Reptil'),
      getChipToneClass('clase', 'Anfibio'),
      getChipToneClass('clase', 'Pez'),
      getChipToneClass('clase', 'Insecto'),
    ]).toEqual([
      'chip-class-mammal',
      'chip-class-bird',
      'chip-class-reptile',
      'chip-class-amphibian',
      'chip-class-fish',
      'chip-class-insect',
    ]);

    expect([
      getChipToneClass('dieta', 'Carnívoro'),
      getChipToneClass('dieta', 'Herbívoro'),
      getChipToneClass('dieta', 'Omnívoro'),
    ]).toEqual(['chip-diet-carnivore', 'chip-diet-herbivore', 'chip-diet-omnivore']);

    expect([
      getChipToneClass('continente', 'África'),
      getChipToneClass('continente', 'América'),
      getChipToneClass('continente', 'Oceanía'),
      getChipToneClass('continente', 'Asia'),
      getChipToneClass('continente', 'Europa'),
      getChipToneClass('continente', 'Antártida'),
    ]).toEqual([
      'chip-continent-africa',
      'chip-continent-america',
      'chip-continent-oceania',
      'chip-continent-asia',
      'chip-continent-europe',
      'chip-continent-antarctica',
    ]);
  });

  test('usa el tono de la categoría para valores desconocidos', () => {
    expect(getChipToneClass('clase', 'Desconocida')).toBe('chip-class-default');
    expect(getChipToneClass('dieta', 'Desconocida')).toBe('chip-diet-default');
    expect(getChipToneClass('continente', 'Desconocido')).toBe('chip-continent-default');
  });
});
