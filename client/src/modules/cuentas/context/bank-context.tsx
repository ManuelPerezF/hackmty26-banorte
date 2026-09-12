'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { api, setSession, type Session } from '@/shared/api/client';
import type { Account, Profile, OwnedCard } from '@/shared/api/types';
const BankContext = createContext<{
  session: Session;
  account: Account;
  profile: Profile;
  cards: OwnedCard[];
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  prefer: (id: string) => Promise<void>;
} | null>(null);
export function BankProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [data, setData] = useState<{
    session: Session;
    account: Account;
    profile: Profile;
    cards: OwnedCard[];
  } | null>(null);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    const session = await api<Session>('/auth/session');
    setSession(session);
    const [account, profile, cards] = await Promise.all([
      api<Account>('/account'),
      api<Profile>('/me'),
      api<{ items: OwnedCard[] }>('/me/cards'),
    ]);
    setData({ session, account, profile, cards: cards.items });
    setError('');
  }, []);
  useEffect(() => {
    let active = true;
    const unauthorized = () => {
      setData(null);
      setSession(null);
      router.replace('/login');
    };
    window.addEventListener('bank:unauthorized', unauthorized);
    void Promise.resolve()
      .then(() => refresh())
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : 'No se pudo cargar tu cuenta.',
          );
      });
    return () => {
      active = false;
      window.removeEventListener('bank:unauthorized', unauthorized);
    };
  }, [refresh, router]);
  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cerrar sesión.');
      throw e;
    }
    setSession(null);
    setData(null);
    router.replace('/login');
  };
  const prefer = async (id: string) => {
    await api('/me/preferences', {
      method: 'PATCH',
      body: { preferredCardId: id },
    });
    await refresh();
  };
  if (!data)
    return (
      <main className="bank-loading" aria-busy={!error}>
        <h1>
          {error ? 'No pudimos abrir tu cuenta' : 'Preparando tu espacio'}
        </h1>
        <p>{error || 'Cargando tu información…'}</p>
        {error && (
          <button
            onClick={() => {
              setError('');
              void refresh().catch((e) => setError(e.message));
            }}
          >
            Reintentar
          </button>
        )}
      </main>
    );
  return (
    <BankContext.Provider value={{ ...data, refresh, logout, prefer }}>
      <div key={data.session.user.id} className="bank-session-root">
        {children}
      </div>
      {error && (
        <p className="bank-global-error" role="alert">
          {error}
        </p>
      )}
    </BankContext.Provider>
  );
}
export function useBank() {
  const context = useContext(BankContext);
  if (!context) throw new Error('BankProvider requerido');
  return context;
}
export function useInstruments() {
  const { account, cards } = useBank();
  return [
    { id: account.id, label: account.name },
    ...cards.map((c) => ({
      id: c.id,
      label: `${c.product.name} · ${c.last4}`,
    })),
  ];
}
