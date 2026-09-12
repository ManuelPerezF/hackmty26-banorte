import { useState } from 'react';
import { useMetas } from '@/modules/metas/hooks/useMetas';
import type { CardSelectionValue } from '@/modules/tarjetas/types/tarjetas.types';
import { navigation } from '../data/navigation';
export function usePanel() {
  const metas = useMetas();
  const [section, setSection] = useState('Inicio');
  const [savedCard, setSavedCard] = useState<CardSelectionValue | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const changeSection = (title: string) => {
    setSection(title);
    setSearchOpen(false);
    setQuery('');
  };
  const results = navigation.filter((item) =>
    item.title.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')),
  );

  return {
    metas,
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
