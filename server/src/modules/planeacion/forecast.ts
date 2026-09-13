/** Proyección de cierre de mes: lo variable se extrapola, lo fijo se suma tal cual. */
export type RecurrenceCharge = { dayOfMonth: number; amountCents: number; type: string };

export type Forecast = {
  spentCents: number;
  dailyAverageCents: number;
  projectedVariableCents: number;
  pendingFixedCents: number;
  projectedTotalCents: number;
  daysElapsed: number;
  daysRemaining: number;
  budgetTotalCents: number;
  /** Porcentaje del presupuesto que consumiría la proyección; null si no hay presupuesto. */
  budgetUsagePct: number | null;
};

export function forecastMonth(input: {
  /** Gasto ya registrado del mes en curso, en centavos. */
  spentCents: number;
  /** Fecha de hoy en la zona del usuario, YYYY-MM-DD. */
  today: string;
  recurrences: RecurrenceCharge[];
  budgetTotalCents: number;
}): Forecast {
  const [year, month, day] = input.today.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // El día en curso cuenta como transcurrido: dividir entre 0 el día 1 no tiene sentido.
  const daysElapsed = Math.min(Math.max(day, 1), daysInMonth);
  const daysRemaining = daysInMonth - daysElapsed;

  const dailyAverageCents = Math.round(input.spentCents / daysElapsed);
  const projectedVariableCents = dailyAverageCents * daysRemaining;

  // Solo los cargos fijos que aún no han caído este mes.
  const pendingFixedCents = input.recurrences
    .filter((r) => r.type === "expense" && r.dayOfMonth > daysElapsed)
    .reduce((total, r) => total + r.amountCents, 0);

  const projectedTotalCents = input.spentCents + projectedVariableCents + pendingFixedCents;
  return {
    spentCents: input.spentCents,
    dailyAverageCents,
    projectedVariableCents,
    pendingFixedCents,
    projectedTotalCents,
    daysElapsed,
    daysRemaining,
    budgetTotalCents: input.budgetTotalCents,
    budgetUsagePct:
      input.budgetTotalCents > 0
        ? Math.round((projectedTotalCents / input.budgetTotalCents) * 100)
        : null,
  };
}
