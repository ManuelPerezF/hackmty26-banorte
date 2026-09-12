import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
export type NavigationItem = { title: string; icon: LucideIcon };
export type AppShellProps = {
  children: ReactNode;
  navigation: NavigationItem[];
  section: string;
  onNavigate: (section: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  query: string;
  setQuery: (query: string) => void;
  results: NavigationItem[];
};
