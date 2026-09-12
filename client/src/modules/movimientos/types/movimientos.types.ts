export type MovementType = 'income' | 'expense';
export type Movement = {
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
