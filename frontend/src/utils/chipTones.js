const CHIP_TONE_CLASSES = {
  clase: {
    Mamífero: 'chip-class-mammal',
    Ave: 'chip-class-bird',
    Reptil: 'chip-class-reptile',
    Anfibio: 'chip-class-amphibian',
    Pez: 'chip-class-fish',
    Insecto: 'chip-class-insect',
  },
  dieta: {
    Carnívoro: 'chip-diet-carnivore',
    Herbívoro: 'chip-diet-herbivore',
    Omnívoro: 'chip-diet-omnivore',
  },
  continente: {
    África: 'chip-continent-africa',
    América: 'chip-continent-america',
    Oceanía: 'chip-continent-oceania',
    Asia: 'chip-continent-asia',
    Europa: 'chip-continent-europe',
    Antártida: 'chip-continent-antarctica',
  },
};

const FALLBACK_TONES = {
  clase: 'chip-class-default',
  dieta: 'chip-diet-default',
  continente: 'chip-continent-default',
};

export function getChipToneClass(category, value) {
  return CHIP_TONE_CLASSES[category]?.[value] ?? FALLBACK_TONES[category] ?? '';
}
