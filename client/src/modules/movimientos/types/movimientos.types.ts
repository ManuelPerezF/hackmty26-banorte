export type MovementType = 'income' | 'expense';
export type Movement = {
  account?: { id: string; name: string; currency: string };
  card?: {
    id: string;
    last4: string;
    product: { key: string; name: string; imageKey: string };
  } | null;
  cardId?: string | null;
  id: string;
  description: string;
  amountCents: number;
  type: MovementType;
  category: string;
  date: string;
  notes: string;
  createdAt: number;
  source: 'demo' | 'manual';
  instrumentId?: string;
};
export type MovementInput = {
  instrumentId?: string;
  description: string;
  amount: string;
  type: MovementType;
  category: string;
  date: string;
  notes: string;
};
export type MovementFilters = {
  instrumentId?: string;
  query: string;
  type: 'all' | MovementType;
  category: string;
  from: string;
  to: string;
};
