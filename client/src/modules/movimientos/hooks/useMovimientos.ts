import { useCallback, useEffect, useRef, useState } from 'react';
import { api, allPages, mutationKey, type KeyState } from '@/shared/api/client';
import { useBank } from '@/modules/cuentas/context/bank-context';
import { parseAmountCents } from '../services/movimientos.service';
import type { Movement, MovementInput } from '../types/movimientos.types';
export function useMovimientos() {
  const bank = useBank();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  const key = useRef<KeyState['current']>(null);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    const rows = await allPages<Movement>('/movements', signal);
    setMovements(
      rows.map((m) => ({ ...m, instrumentId: m.card?.id ?? m.account?.id })),
    );
    setReady(true);
    setError('');
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    void Promise.resolve()
      .then(() => refresh(abort.signal))
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      });
    return () => abort.abort();
  }, [refresh]);
  const registerMovement = async (input: MovementInput) => {
    if (!ready || lock.current) return false;
    lock.current = true;
    setSaving(true);
    try {
      const body = {
        description: input.description,
        amountCents: parseAmountCents(input.amount),
        type: input.type,
        category: input.category,
        date: input.date,
        notes: input.notes,
        cardId:
          input.instrumentId && input.instrumentId !== bank.account.id
            ? input.instrumentId
            : null,
      };
      const saved = await api<Movement>('/movements', {
        method: 'POST',
        body,
        key: mutationKey(key, body),
      });
      key.current = null;
      setNotice(`«${input.description}» registrado en tu historial.`);
      setMovements((rows) => [
        { ...saved, instrumentId: saved.card?.id ?? saved.account?.id },
        ...rows.filter((m) => m.id !== saved.id),
      ]);
      await Promise.all([refresh(), bank.refresh()]).catch(() =>
        setError(
          'El movimiento se guardó. Recarga para actualizar el saldo y el historial.',
        ),
      );
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
      return false;
    } finally {
      setSaving(false);
      lock.current = false;
    }
  };
  return {
    movements,
    balanceCents: bank.account.balanceCents,
    totals: {
      income: bank.account.incomeCents,
      expense: bank.account.expenseCents,
      net: bank.account.incomeCents - bank.account.expenseCents,
    },
    ready,
    saving,
    error,
    notice,
    registerMovement,
    refresh,
    clearError: () => setError(''),
  };
}
