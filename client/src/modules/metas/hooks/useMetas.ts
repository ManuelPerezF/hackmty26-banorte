import { useEffect, useRef, useState } from 'react';
import { api, allPages, mutationKey, type KeyState } from '@/shared/api/client';
import type { Goal } from '@/shared/api/types';
import type { GoalInput } from '../types/metas.types';
export function useMetas() {
  const [rows, setRows] = useState<Goal[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const key = useRef<KeyState['current']>(null);
  const lock = useRef(false);
  useEffect(() => {
    const a = new AbortController();
    Promise.all([
      allPages<Goal>('/goals', a.signal),
      allPages<Goal>('/goals?status=archived', a.signal),
    ])
      .then(([active, archived]) => {
        if (a.signal.aborted) return;
        setRows([...active, ...archived]);
        setLoaded(true);
      })
      .catch((e) => {
        if (!a.signal.aborted)
          setError(
            e instanceof Error ? e.message : 'No se pudieron cargar tus metas.',
          );
      })
      .finally(() => {
        if (!a.signal.aborted) setLoading(false);
      });
    return () => a.abort();
  }, [attempt]);
  const mutate = async (request: () => Promise<Goal>, message: string) => {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const saved = await request();
      setRows((current) => [
        saved,
        ...current.filter((g) => g.id !== saved.id),
      ]);
      setNotice(message);
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No se pudo guardar. Inténtalo de nuevo.',
      );
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const addGoal = (input: GoalInput) => {
    const body = {
      name: input.name,
      targetCents: Math.round(input.target * 100),
      deadline: input.deadline ?? null,
    };
    return mutate(async () => {
      const saved = await api<Goal>('/goals', {
        method: 'POST',
        body,
        key: mutationKey(key, body),
      });
      key.current = null;
      return saved;
    }, 'Meta creada. Ya puedes revisar tu plan.');
  };
  const editGoal = (
    id: string,
    body: { name: string; targetCents: number; deadline: string | null },
  ) =>
    mutate(
      () => api<Goal>(`/goals/${id}`, { method: 'PATCH', body }),
      'Meta actualizada.',
    );
  const archive = (id: string) =>
    mutate(
      () =>
        api<Goal>(`/goals/${id}`, {
          method: 'PATCH',
          body: { status: 'archived' },
        }),
      'Meta archivada. Puedes recuperarla en Archivadas.',
    );
  const restore = (id: string) =>
    mutate(
      () =>
        api<Goal>(`/goals/${id}`, {
          method: 'PATCH',
          body: { status: 'active' },
        }),
      'Meta recuperada.',
    );
  return {
    loaded,
    retry: () => {
      setError('');
      setLoading(true);
      setAttempt((value) => value + 1);
    },
    goals: rows.filter((g) => g.status === 'active'),
    archivedGoals: rows.filter((g) => g.status === 'archived'),
    editGoal,
    addGoal,
    archive,
    restore,
    error,
    notice,
    busy,
    loading,
  };
}
