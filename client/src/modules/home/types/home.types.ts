import type { CardId } from '@/modules/tarjetas/types/tarjetas.types';
export type DemoTransaction = {
  name: string;
  category: string;
  date: string;
  amount: string;
  incoming: boolean;
  initials: string;
};
export type HomeProps = {
  onNavigate: (section: string) => void;
  cardId?: CardId;
};
