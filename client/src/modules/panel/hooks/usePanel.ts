import { useBank } from '@/modules/cuentas/context/bank-context';
import { useState } from 'react';
import { useMovimientos } from '@/modules/movimientos/hooks/useMovimientos';
import { useMetas } from '@/modules/metas/hooks/useMetas';
import type { CardSelectionValue } from '@/modules/tarjetas/types/tarjetas.types';
import { navigation } from '../data/navigation';
export function usePanel() {
  const bank = useBank();
  const metas = useMetas();
  const ledger = useMovimientos();
  const [movementInstrument, setMovementInstrument] = useState('');
  const [section, setSection] = useState('Inicio');
  const preferred = bank.cards.find((c) => c.isPreferred) ?? bank.cards[0];
  const savedCard: CardSelectionValue | null = preferred
    ? {
        cardId: preferred.product.key,
        format: 'fisica',
        label: `${preferred.product.name} · ${preferred.last4}`,
      }
    : null;
  const setSavedCard = async (value: CardSelectionValue) => {
    const card = bank.cards.find((c) => c.product.key === value.cardId);
    if (card) await bank.prefer(card.id);
  };
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const changeSection = (title: string) => {
    setSection(title);
    if (title === 'Movimientos') setMovementInstrument('');
    setSearchOpen(false);
    setQuery('');
  };
  const results = navigation.filter((item) =>
    item.title.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')),
  );

  return {
    bank,
    movementInstrument,
    showMovements: (instrumentId = '') => {
      changeSection('Movimientos');
      setMovementInstrument(instrumentId);
    },
    metas,
    ledger,
    section,
    savedCard,
    setSavedCard,
    searchOpen,
    setSearchOpen,
    query,
    setQuery,
    changeSection,
    results,
  };
}
