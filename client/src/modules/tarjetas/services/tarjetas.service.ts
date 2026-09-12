import { cardCatalog } from '../data/card-catalog';
import type {
  CardId,
  CardFormat,
  CardSelectionValue,
} from '../types/tarjetas.types';
// Local demo catalog. This service does not call a bank or persist requests.
export const showcaseCards = cardCatalog.filter((card) => card.id !== 'roja');
export function getCard(id: CardId) {
  return cardCatalog.find((card) => card.id === id)!;
}
export function createCardSelection(
  cardId: CardId,
  format: CardFormat,
): CardSelectionValue {
  return {
    cardId,
    format,
    label: `${format === 'fisica' ? 'Física' : 'Digital'} · Banorte ${getCard(cardId).name}`,
  };
}
