import type { Movement } from '@/modules/movimientos/types/movimientos.types';
import { movementTotals } from '@/modules/movimientos/services/movimientos.service';
import type { AssistantScenario } from '../types/asistente.types';
// The original intent detection remains a local demo, not an LLM integration.
export function classifyDemoPrompt(prompt: string): AssistantScenario {
  return /flujo|ingres|balance/i.test(prompt) ? 'cashflow' : 'expenses';
}

export function getMovementInsights(movements: readonly Movement[]) {
  const totals = movementTotals(movements);
  const categories = new Map<string, number>();
  for (const item of movements)
    if (item.type === 'expense')
      categories.set(
        item.category,
        (categories.get(item.category) ?? 0) + item.amountCents,
      );
  const maximum = Math.max(1, ...categories.values());
  const spending = [...categories]
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => ({
      name,
      amount,
      width: (amount / maximum) * 100,
      share: totals.expense ? Math.round((amount / totals.expense) * 100) : 0,
    }));
  const scale = Math.max(1, totals.income, totals.expense);
  return {
    totals,
    spending,
    incomeWidth: (totals.income / scale) * 100,
    expenseWidth: (totals.expense / scale) * 100,
  };
}
