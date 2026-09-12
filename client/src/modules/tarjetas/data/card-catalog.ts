import type { BankCard } from '../types/tarjetas.types';
export const cardCatalog = [
  {
    id: 'platinum',
    name: 'Platinum',
    image: '/images/cards/banorte-platinum-hd.png',
    network: 'Visa',
    artwork: 'full',
    caption: 'Una nueva perspectiva.',
    color: 'Plata Platinum',
  },
  {
    id: 'oro',
    name: 'Oro',
    image: '/images/cards/banorte-oro.png',
    network: 'Visa',
    artwork: 'framed',
    caption: 'Haz espacio para lo que viene.',
    color: 'Dorado Banorte',
  },
  {
    id: 'clasica',
    name: 'Clásica',
    image: '/images/cards/banorte-clasica.png',
    network: 'Visa',
    artwork: 'full',
    caption: 'Contigo, en tu día a día.',
    color: 'Rojo Clásica',
  },
] as const satisfies readonly BankCard[];
