import { useState } from 'react';
import { createDemoGoal } from '../services/metas.service';
import type { GoalInput, SavingsGoal } from '../types/metas.types';
export function useMetas() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const addGoal = (input: GoalInput) => {
    try {
      const goal = createDemoGoal(input);
      setGoals((current) => [...current, goal]);
      setError('');
      setNotice(`Meta «${goal.name}» creada.`);
      return true;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'No pudimos crear la meta.',
      );
      setNotice('');
      return false;
    }
  };
  return { goals, error, notice, addGoal };
}
