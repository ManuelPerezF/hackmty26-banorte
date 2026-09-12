'use client';
import { TarjetasPanel } from '../components/tarjetasPanel';
import type { CardSelectionValue } from '../types/tarjetas.types';
import type { useMovimientos } from '@/modules/movimientos/hooks/useMovimientos';
export function CardSelection(props: {
  saved: CardSelectionValue | null;
  onSave: (value: CardSelectionValue) => void;
  ledger: ReturnType<typeof useMovimientos>;
  onMovements: (instrumentId?: string) => void;
}) {
  return <TarjetasPanel {...props} />;
}
