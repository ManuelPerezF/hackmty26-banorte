import { useState } from 'react';
import { useMovimientos } from '@/modules/movimientos/hooks/useMovimientos';
import { useMetas } from '@/modules/metas/hooks/useMetas';
import type { CardSelectionValue } from '@/modules/tarjetas/types/tarjetas.types';
import { navigation } from '../data/navigation';
export function usePanel() {
  const metas = useMetas();
  const ledger = useMovimientos();
  const [movementInstrument, setMovementInstrument] = useState('');
  const [section, setSection] = useState('Inicio');
  const [savedCard, setSavedCard] = useState<CardSelectionValue | null>(null);
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
