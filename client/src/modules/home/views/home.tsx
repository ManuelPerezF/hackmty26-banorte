import { HomeOverview } from '../components/homeOverview';
import { getDemoTransactions } from '../services/home.service';
import type { HomeProps } from '../types/home.types';
export function AccountsOverview(props: HomeProps) {
  return <HomeOverview {...props} transactions={getDemoTransactions()} />;
}
