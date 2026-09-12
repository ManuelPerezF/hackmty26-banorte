import { transactions } from '../data/demo-transactions';
import type { DemoTransaction } from '../types/home.types';
export function getDemoTransactions(): readonly DemoTransaction[] {
  return transactions;
}
