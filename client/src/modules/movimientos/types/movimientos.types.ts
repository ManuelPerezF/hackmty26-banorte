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
};
export type MovementInput = {
  description: string;
  amount: string;
  type: MovementType;
  category: string;
  date: string;
  notes: string;
};
export type MovementFilters = {
  query: string;
  type: 'all' | MovementType;
  category: string;
  from: string;
  to: string;
};
