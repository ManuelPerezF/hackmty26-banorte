import { z } from "zod";
import { dateSchema, categories } from "../movimientos/schemas/movimiento.schema";
const period = z
  .strictObject({ from: dateSchema, to: dateSchema })
  .refine(
    (p) => p.from <= p.to && (Date.parse(p.to) - Date.parse(p.from)) / 86400000 < 366,
    "Rango inválido o mayor a 366 días.",
  );
export const comparisonSchema = z.strictObject({
  first: period,
  second: period,
  category: z.enum(categories).optional(),
});
type PeriodResult = {
  period: { from: string; to: string };
  totals: { incomeCents: number; expenseCents: number; netCents: number; movementCount: number };
};
export function comparePeriods(first: PeriodResult, second: PeriodResult) {
  const deltaCents = second.totals.expenseCents - first.totals.expenseCents;
  return {
    first: { period: first.period, ...first.totals },
    second: { period: second.period, ...second.totals },
    deltaCents,
    changePercent: first.totals.expenseCents
      ? Math.round((deltaCents / first.totals.expenseCents) * 10000) / 100
      : null,
    differentDurations:
      Date.parse(first.period.to) - Date.parse(first.period.from) !==
      Date.parse(second.period.to) - Date.parse(second.period.from),
    currency: "MXN",
  };
}
