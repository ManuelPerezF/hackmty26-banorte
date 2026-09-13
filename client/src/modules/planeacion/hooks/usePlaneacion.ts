'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/shared/api/client';

export type Budget = {
  id: string;
  category: string;
  limitCents: number;
  spentCents: number;
  remainingCents: number;
  usagePct: number;
  status: 'on_track' | 'warning' | 'exceeded';
};
export type Recurrence = {
  id: string;
  description: string;
  category: string;
  amountCents: number;
  type: 'income' | 'expense';
  dayOfMonth: number;
};
export type Forecast = {
  spentCents: number;
  dailyAverageCents: number;
  pendingFixedCents: number;
  projectedTotalCents: number;
  daysElapsed: number;
  daysRemaining: number;
  budgetTotalCents: number;
  budgetUsagePct: number | null;
};
export type Health = {
  score: number;
  grade: string;
  incomeCents: number;
  expenseCents: number;
  breakdown: { savings: number; budgets: number; goals: number };
  basis: { hasIncome: boolean; budgetCount: number; goalCount: number };
};
export type SpendingCategory = {
  category: string;
  expenseCents: number;
  share: number;
};

type PlanData = [
  { items: Budget[] },
  { items: Recurrence[] },
  Forecast,
  Health,
  { categories: SpendingCategory[] },
];

export function usePlaneacion() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurrences, setRecurrences] = useState<Recurrence[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [spending, setSpending] = useState<SpendingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // `fetchPlan` solo trae datos; el estado se asienta en el `.then`, que es
  // donde React espera los setState de una carga asíncrona.
  const fetchPlan = useCallback(
    (signal?: AbortSignal): Promise<PlanData> =>
      Promise.all([
        api<{ items: Budget[] }>('/budgets', { signal }),
        api<{ items: Recurrence[] }>('/recurrences', { signal }),
        api<Forecast>('/forecast', { signal }),
        api<Health>('/financial-health', { signal }),
        // Mes en curso por defecto: es lo que alimenta las sugerencias de límite.
        api<{ categories: SpendingCategory[] }>('/insights/spending', { signal }),
      ]),
    [],
  );

  const apply = useCallback(([b, r, f, h, sp]: PlanData) => {
    setBudgets(b.items);
    setRecurrences(r.items);
    setForecast(f);
    setHealth(h);
    setSpending(sp.categories);
    setError('');
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchPlan(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        apply(result);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'No se pudo cargar tu plan.');
        setLoading(false);
      });
    return () => controller.abort();
  }, [fetchPlan, apply]);

  const mutate = async (run: () => Promise<unknown>) => {
    if (busy) return false;
    setBusy(true);
    setError('');
    try {
      await run();
      apply(await fetchPlan());
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    budgets,
    recurrences,
    forecast,
    health,
    spending,
    loading,
    busy,
    error,
    setBudget: (category: string, amountCents: number) =>
      mutate(() =>
        api('/budgets', { method: 'PUT', body: { category, amountCents } }),
      ),
    removeBudget: (id: string) =>
      mutate(() => api(`/budgets/${id}`, { method: 'DELETE' })),
    addRecurrence: (body: Omit<Recurrence, 'id'>) =>
      mutate(() => api('/recurrences', { method: 'POST', body })),
    removeRecurrence: (id: string) =>
      mutate(() => api(`/recurrences/${id}`, { method: 'DELETE' })),
  };
}
