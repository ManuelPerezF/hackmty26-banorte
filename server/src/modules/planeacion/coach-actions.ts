/**
 * Sugerencias accionables calculadas en el servidor, no por el modelo.
 *
 * El LLM redacta; los botones salen de aritmética sobre datos propios. Así una
 * sugerencia nunca puede inventar una meta, un monto o una categoría que no
 * exista, y el usuario sigue siendo quien confirma cualquier escritura.
 */
export type CoachAction =
  | {
      type: "contribute_goal";
      label: string;
      goalId: string;
      goalName: string;
      amountCents: number;
    }
  | { type: "create_goal"; label: string }
  | { type: "review_budget"; label: string; category: string; overspentCents: number };

const ROUND_TO_CENTS = 5000; // $50

export function suggestCoachActions(input: {
  goals: { id: string; name: string; targetCents: number; savedCents: number; status: string }[];
  budgets: { category: string; amountCents: number; spentCents: number }[];
  balanceCents: number;
}): CoachAction[] {
  const actions: CoachAction[] = [];

  // Presupuestos excedidos primero: es dinero que ya se fue, no un plan a futuro.
  const overspent = input.budgets
    .filter((b) => b.spentCents > b.amountCents)
    .sort((a, b) => b.spentCents - b.amountCents - (a.spentCents - a.amountCents))
    .slice(0, 1);
  for (const b of overspent)
    actions.push({
      type: "review_budget",
      label: `Revisar tu presupuesto de ${b.category}`,
      category: b.category,
      overspentCents: b.spentCents - b.amountCents,
    });

  // Aportar a las metas más cercanas a cumplirse: rematar una meta motiva más
  // que avanzar un punto en la más lejana.
  const pending = input.goals
    .filter((g) => g.status === "active" && g.savedCents < g.targetCents && g.targetCents > 0)
    .sort((a, b) => b.savedCents / b.targetCents - a.savedCents / a.targetCents);

  for (const goal of pending.slice(0, 2)) {
    const missing = goal.targetCents - goal.savedCents;
    // ~10% de lo que falta, redondeado a $50 arriba, nunca más de lo que falta.
    const suggested = Math.min(
      missing,
      Math.max(ROUND_TO_CENTS, Math.ceil((missing * 0.1) / ROUND_TO_CENTS) * ROUND_TO_CENTS),
    );
    actions.push({
      type: "contribute_goal",
      label: `Aportar ${formatMxn(suggested)} a ${goal.name}`,
      goalId: goal.id,
      goalName: goal.name,
      amountCents: suggested,
    });
  }

  if (pending.length === 0 && input.balanceCents > 0)
    actions.push({ type: "create_goal", label: "Crear tu primera meta de ahorro" });

  return actions.slice(0, 3);
}

function formatMxn(cents: number) {
  return `$${(cents / 100).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
