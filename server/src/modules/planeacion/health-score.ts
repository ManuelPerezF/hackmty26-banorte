/** Salud financiera 0–100. Tres componentes independientes que suman. */
export type HealthScore = {
  score: number;
  grade: "Excelente" | "Bueno" | "Regular" | "Necesita atención";
  breakdown: { savings: number; budgets: number; goals: number };
  /** Qué se midió y qué no, para que la cifra sea explicable y no un oráculo. */
  basis: { hasIncome: boolean; budgetCount: number; goalCount: number };
};

export function computeHealthScore(input: {
  incomeCents: number;
  expenseCents: number;
  budgets: { amountCents: number; spentCents: number }[];
  goals: { targetCents: number; savedCents: number }[];
}): HealthScore {
  // Ahorro (40): una tasa de 20% ya vale el puntaje completo.
  let savings = 0;
  if (input.incomeCents > 0) {
    const rate = (input.incomeCents - input.expenseCents) / input.incomeCents;
    savings = Math.max(0, Math.min(40, (rate / 0.2) * 40));
  }

  // Presupuestos (35): sin presupuestos se otorga la mitad. No configurar algo
  // no es lo mismo que gastar de más, y castigarlo empujaría el score a cero
  // en el primer uso.
  let budgets = 17.5;
  if (input.budgets.length > 0) {
    const adherence = input.budgets.map((b) =>
      b.amountCents > 0 ? Math.max(0, Math.min(1, 1 - b.spentCents / b.amountCents)) : 1,
    );
    budgets = (adherence.reduce((a, b) => a + b, 0) / adherence.length) * 35;
  }

  // Metas (25): sin metas son 0 puntos, no la mitad. Aquí sí falta algo real
  // que hacer, y el score debe invitar a crearlas.
  let goals = 0;
  if (input.goals.length > 0) {
    const progress = input.goals.map((g) =>
      g.targetCents > 0 ? Math.min(1, g.savedCents / g.targetCents) : 0,
    );
    goals = (progress.reduce((a, b) => a + b, 0) / progress.length) * 25;
  }

  const score = Math.round(savings + budgets + goals);
  return {
    score,
    grade:
      score >= 80
        ? "Excelente"
        : score >= 60
          ? "Bueno"
          : score >= 40
            ? "Regular"
            : "Necesita atención",
    breakdown: {
      savings: Math.round(savings),
      budgets: Math.round(budgets),
      goals: Math.round(goals),
    },
    basis: {
      hasIncome: input.incomeCents > 0,
      budgetCount: input.budgets.length,
      goalCount: input.goals.length,
    },
  };
}
