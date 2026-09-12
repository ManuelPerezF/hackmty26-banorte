import { useState } from 'react';
import { getCard, createCardSelection } from '../services/tarjetas.service';
import type {
  CardId,
  CardFormat,
  CardSelectionProps,
} from '../types/tarjetas.types';
export function useTarjetas({
  saved,
  onSave,
}: Pick<CardSelectionProps, 'saved' | 'onSave'>) {
  const [cardId, setCardId] = useState<CardId>(saved?.cardId ?? 'clasica');
  const [format, setFormat] = useState<CardFormat>(saved?.format ?? 'fisica');
  return {
    cardId,
    setCardId,
    format,
    setFormat,
    card: getCard(cardId),
    formatLabel: format === 'fisica' ? 'Física' : 'Digital',
    saveSelection: () => onSave(createCardSelection(cardId, format)),
  };
}
