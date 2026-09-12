import { useEffect, useState } from 'react';
import { demoMovements } from '../data/demo-movimientos';
import {
  createMovement,
  loadMovements,
  saveMovements,
  sortMovements,
  movementTotals,
  OPENING_BALANCE_CENTS,
} from '../services/movimientos.service';
import type { MovementInput } from '../types/movimientos.types';
export function useMovimientos() {
  const [movements, setMovements] = useState(demoMovements);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    loadMovements()
      .then((items) => {
        if (active) {
          setMovements(items);
          setReady(true);
        }
      })
      .catch(() => {
        if (active)
          setError(
            'No pudimos leer el historial de este navegador. Recarga para reintentar; tus datos guardados no se han modificado.',
          );
      });
    return () => {
      active = false;
    };
  }, []);
  const registerMovement = (input: MovementInput) => {
    if (!ready) return false;
    try {
      const item = createMovement(input);
      const next = sortMovements([item, ...movements]);
      try {
        saveMovements(next);
      } catch {
        throw new Error(
          'No se pudo guardar en este navegador. Tu movimiento no fue registrado; revisa el almacenamiento y vuelve a intentar.',
        );
      }
      setMovements(next);
      setError('');
      setNotice(`«${item.description}» registrado en tu historial.`);
      return true;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo registrar el movimiento.',
      );
      setNotice('');
      return false;
    }
  };
  const totals = movementTotals(movements);
  return {
    movements: sortMovements(movements),
    balanceCents: OPENING_BALANCE_CENTS + totals.net,
    totals,
    ready,
    error,
    notice,
    registerMovement,
    clearError: () => {
      if (ready) setError('');
    },
  };
}
