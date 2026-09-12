import { useEffect, useRef, useState } from 'react';
import { api, allPages, mutationKey, type KeyState } from '@/shared/api/client';
import type { Goal } from '@/shared/api/types';
import type { GoalInput } from '../types/metas.types';
export function useMetas() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const key = useRef<KeyState['current']>(null);
  const lock = useRef(false);
  const refresh = async () => {
    setGoals(await allPages<Goal>('/goals'));
  };
  useEffect(() => {
    const a = new AbortController();
    allPages<Goal>('/goals', a.signal)
      .then(setGoals)
      .catch((e) => {
        if (!a.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!a.signal.aborted) setLoading(false);
      });
    return () => a.abort();
  }, []);
  const addGoal = async (input: GoalInput) => {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const body = {
        name: input.name,
        targetCents: Math.round(input.target * 100),
      };
      const saved = await api<Goal>('/goals', {
        method: 'POST',
        body,
        key: mutationKey(key, body),
      });
      key.current = null;
      setGoals((rows) => [...rows.filter((g) => g.id !== saved.id), saved]);
      await refresh().catch(() =>
        setError('La meta se guardó. Recarga para actualizar la lista.'),
      );

      setNotice('Meta guardada.');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const archive = async (id: string) => {
    setError('');
    try {
      await api(`/goals/${id}`, {
        method: 'PATCH',
        body: { status: 'archived' },
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo archivar.');
    }
  };
  const editGoal = async (
    id: string,
    body: { name: string; targetCents: number; deadline: string | null },
  ) => {
    setError('');
    try {
      await api(`/goals/${id}`, { method: 'PATCH', body });
      await refresh();
      setNotice('Meta actualizada.');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar.');
      return false;
    }
  };
  return { editGoal, goals, error, notice, addGoal, busy, loading, archive };
}
