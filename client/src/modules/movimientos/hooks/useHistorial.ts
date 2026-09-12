import { useState } from 'react';
import {
  filterMovements,
  movementTotals,
} from '../services/movimientos.service';
import type { Movement, MovementFilters } from '../types/movimientos.types';
export const PAGE_SIZE = 8;
const initialFilters: MovementFilters = {
  instrumentId: '',
  query: '',
  type: 'all',
  category: '',
  from: '',
  to: '',
};
export function useHistorial(movements: Movement[], instrumentId = '') {
  const [filters, setFilters] = useState<MovementFilters>({
    ...initialFilters,
    instrumentId,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const updateFilter = <K extends keyof MovementFilters>(
    key: K,
    value: MovementFilters[K],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
    setSelectedId(null);
  };
  const clearFilters = () => {
    setFilters(initialFilters);
    setPage(1);
    setSelectedId(null);
  };
  const filtered = filterMovements(movements, filters);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  return {
    filters,
    filtersOpen,
    setFiltersOpen,
    updateFilter,
    clearFilters,
    selected: movements.find((item) => item.id === selectedId),
    setSelectedId,
    filtered,
    visible: filtered.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    ),
    page: currentPage,
    setPage,
    pageCount,
    totals: movementTotals(filtered),
  };
}
