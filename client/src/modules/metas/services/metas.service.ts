import type { GoalInput, SavingsGoal } from '../types/metas.types';
// A local planning goal only. No funds are reserved or transferred.
export function createDemoGoal(input: GoalInput): SavingsGoal {
  const name = input.name.trim();
  if (!name || name.length > 60)
    throw new Error('Escribe un nombre de hasta 60 caracteres.');
  if (
    !Number.isFinite(input.target) ||
    input.target < 1 ||
    input.target > 1000000000
  ) {
    throw new Error('Escribe un monto entre $1 y $1,000,000,000.');
  }
  return {
    id: crypto.randomUUID(),
    name,
    target: Math.round(input.target * 100) / 100,
  };
}
