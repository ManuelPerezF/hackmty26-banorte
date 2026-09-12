'use client';
import { TarjetasPanel } from '../components/tarjetasPanel';
import { useTarjetas } from '../hooks/useTarjetas';
import type { CardSelectionProps } from '../types/tarjetas.types';
export function CardSelection(props: CardSelectionProps) {
  const tarjetas = useTarjetas(props);
  return (
    <TarjetasPanel saved={props.saved} onBack={props.onBack} {...tarjetas} />
  );
}
