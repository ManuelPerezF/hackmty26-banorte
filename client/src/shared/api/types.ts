import type { CardId } from '@/modules/tarjetas/types/tarjetas.types';
export type Account = {
  id: string;
  name: string;
  currency: string;
  openingBalanceCents: number;
  balanceCents: number;
  incomeCents: number;
  expenseCents: number;
};
export type Profile = {
  id: string;
  displayName: string;
  email: string;
  locale: string;
  timezone: string;
  preferredCardId: string | null;
};
export type OwnedCard = {
  id: string;
  last4: string;
  status: string;
  isPreferred: boolean;
  product: { key: CardId; name: string; network: string; imageKey: CardId };
};
export type Goal = {
  id: string;
  name: string;
  targetCents: number;
  deadline: string | null;
  status: 'active' | 'archived';
  createdAt: number;
};
export type Insights = {
  currency: string;
  period: { from: string; to: string; timezone: string };
  totals: {
    incomeCents: number;
    expenseCents: number;
    netCents: number;
    movementCount: number;
  };
  categories: { category: string; expenseCents: number; share: number }[];
  series: { periodStart: string; incomeCents: number; expenseCents: number }[];
};
