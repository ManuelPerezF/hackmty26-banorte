'use client';
import { AsistentePanel } from '../components/asistentePanel';
import { useAsistente } from '../hooks/useAsistente';
import type { Movement } from '@/modules/movimientos/types/movimientos.types';
import { getMovementInsights } from '../services/asistente.service';
export function AssistantWorkspace({ movements }: { movements: Movement[] }) {
  const assistant = useAsistente();
  return (
    <AsistentePanel {...assistant} insights={getMovementInsights(movements)} />
  );
}
