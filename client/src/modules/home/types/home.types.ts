import type { CardId } from '@/modules/tarjetas/types/tarjetas.types';
import type { useMovimientos } from '@/modules/movimientos/hooks/useMovimientos';
export type HomeProps = {
  onNavigate: (section: string) => void;
  cardId?: CardId;
  ledger: ReturnType<typeof useMovimientos>;
};
