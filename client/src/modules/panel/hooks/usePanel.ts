import { useState } from 'react';
import type { CardSelectionValue } from '@/modules/tarjetas/types/tarjetas.types';
import { navigation } from '../data/navigation';
export function usePanel() {
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
