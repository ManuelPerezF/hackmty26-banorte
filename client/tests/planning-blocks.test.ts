import assert from 'node:assert/strict';
import test from 'node:test';
import {
  budgetsSchema,
  coachSchema,
  forecastSchema,
  healthSchema,
} from '../src/modules/asistente/components/planning-schemas.ts';

// Estas formas son las que emite el servidor en el data model (las produce
// PlaneacionService y las ejerce verify-planeacion.cjs contra la API real).
// El renderer entrega a cada bloque el valor YA resuelto en su ruta, así que
// el schema debe aceptar el objeto directo, sin envoltura. Este fue el bug:
// el bloque esperaba `{ forecast: {...} }` y recibía `{...}`.
const forecast = {
  currency: 'MXN',
  period: { from: '2026-09-01', today: '2026-09-12' },
  spentCents: 1002000,
  dailyAverageCents: 83500,
  projectedVariableCents: 1503000,
  pendingFixedCents: 729900,
  projectedTotalCents: 3234900,
  daysElapsed: 12,
  daysRemaining: 18,
  budgetTotalCents: 1140000,
  budgetUsagePct: 284,
  assumptions: { method: 'promedio-diario-del-mes-en-curso', guaranteed: false },
};
const budgets = {
  items: [
    {
      id: '3d3b4b93-0a8f-4b2b-9b2e-2f8b0f6b7d11',
      category: 'Alimentación',
      limitCents: 300000,
      spentCents: 254000,
      remainingCents: 46000,
      usagePct: 85,
      status: 'warning',
    },
  ],
  period: { from: '2026-09-01', today: '2026-09-12' },
  totalLimitCents: 300000,
  totalSpentCents: 254000,
};
const health = {
  period: { from: '2026-09-01', today: '2026-09-12' },
  incomeCents: 1800000,
  expenseCents: 1002000,
  score: 48,
  grade: 'Regular',
  breakdown: { savings: 40, budgets: 3, goals: 5 },
  basis: { hasIncome: true, budgetCount: 3, goalCount: 1 },
};
const coach = {
  items: [
    {
      type: 'review_budget',
      label: 'Revisar tu presupuesto de Entretenimiento',
      category: 'Entretenimiento',
      overspentCents: 8000,
    },
    {
      type: 'contribute_goal',
      label: 'Aportar $410,000.00 a Fondo de emergencia',
      goalId: 'b7a6c9d0-1e2f-4a3b-8c4d-5e6f7a8b9c0d',
      goalName: 'Fondo de emergencia',
      amountCents: 41000000,
    },
  ],
};

test('los bloques de planeación aceptan el valor resuelto en su ruta', () => {
  assert.equal(forecastSchema.parse(forecast).projectedTotalCents, 3234900);
  assert.equal(budgetsSchema.parse(budgets).items[0].status, 'warning');
  assert.equal(healthSchema.parse(health).score, 48);
  assert.equal(coachSchema.parse(coach).items.length, 2);
});

test('la envoltura doble se rechaza — el bug que llegó a producción', () => {
  assert.throws(() => forecastSchema.parse({ forecast }));
  assert.throws(() => healthSchema.parse({ health }));
});

test('la proyección sin presupuesto lleva porcentaje null, no cero', () => {
  const parsed = forecastSchema.parse({
    ...forecast,
    budgetTotalCents: 0,
    budgetUsagePct: null,
  });
  assert.equal(parsed.budgetUsagePct, null);
});
