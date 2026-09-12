/** Planning reference only: no saved balance or investment return is assumed. */
export function goalPlan(
  targetCents: number,
  deadline: string | null,
  today: string,
) {
  if (!Number.isSafeInteger(targetCents) || targetCents <= 0) return null;
  const valid = (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
  if (!deadline || !valid(deadline) || !valid(today)) return null;
  if (deadline <= today)
    return {
      status: deadline === today ? ('today' as const) : ('overdue' as const),
      months: 0,
      monthlyCents: null,
    };
  const [y, m, d] = deadline.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  const months = Math.max(1, (y - ty) * 12 + m - tm + (d > td ? 1 : 0));
  return {
    status: 'scheduled' as const,
    months,
    monthlyCents: Math.ceil(targetCents / months),
  };
}
