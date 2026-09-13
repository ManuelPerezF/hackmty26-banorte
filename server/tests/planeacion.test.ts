import assert from "node:assert/strict";
import { test } from "node:test";
import { forecastMonth } from "../src/modules/planeacion/forecast.ts";
import { computeHealthScore } from "../src/modules/planeacion/health-score.ts";
import { suggestCoachActions } from "../src/modules/planeacion/coach-actions.ts";

test("la proyección extrapola lo variable y suma solo los fijos pendientes", () => {
  const f = forecastMonth({
    spentCents: 300000, // $3,000 en 10 días
    today: "2026-09-10",
    recurrences: [
      { dayOfMonth: 5, amountCents: 100000, type: "expense" }, // ya cayó
      { dayOfMonth: 20, amountCents: 150000, type: "expense" }, // pendiente
      { dayOfMonth: 25, amountCents: 900000, type: "income" }, // ingreso, no cuenta
    ],
    budgetTotalCents: 1000000,
  });
  assert.equal(f.daysElapsed, 10);
  assert.equal(f.daysRemaining, 20); // septiembre tiene 30
  assert.equal(f.dailyAverageCents, 30000);
  assert.equal(f.projectedVariableCents, 600000);
  assert.equal(f.pendingFixedCents, 150000);
  assert.equal(f.projectedTotalCents, 1050000);
  assert.equal(f.budgetUsagePct, 105);
});

test("el día 1 no divide entre cero y febrero no se desborda", () => {
  const f = forecastMonth({
    spentCents: 5000,
    today: "2026-02-01",
    recurrences: [{ dayOfMonth: 28, amountCents: 1000, type: "expense" }],
    budgetTotalCents: 0,
  });
  assert.equal(f.daysElapsed, 1);
  assert.equal(f.daysRemaining, 27); // 2026 no es bisiesto
  assert.equal(f.pendingFixedCents, 1000);
  assert.equal(f.budgetUsagePct, null, "sin presupuesto no se inventa un porcentaje");
});

test("el score reparte 40/35/25 y no castiga lo que no está configurado", () => {
  const perfect = computeHealthScore({
    incomeCents: 100000,
    expenseCents: 80000, // tasa de ahorro 20%
    budgets: [{ amountCents: 10000, spentCents: 0 }],
    goals: [{ targetCents: 10000, savedCents: 10000 }],
  });
  assert.equal(perfect.score, 100);
  assert.equal(perfect.grade, "Excelente");

  const nuevo = computeHealthScore({
    incomeCents: 0,
    expenseCents: 0,
    budgets: [],
    goals: [],
  });
  assert.equal(nuevo.breakdown.budgets, 18, "sin presupuestos se otorga la mitad de 35");
  assert.equal(nuevo.breakdown.goals, 0, "sin metas sí son cero, para invitar a crearlas");
  assert.equal(nuevo.score, 18);
});

test("el gasto excesivo hunde el componente de ahorro pero no lo vuelve negativo", () => {
  const s = computeHealthScore({
    incomeCents: 10000,
    expenseCents: 50000,
    budgets: [{ amountCents: 1000, spentCents: 5000 }],
    goals: [],
  });
  assert.equal(s.breakdown.savings, 0);
  assert.equal(s.breakdown.budgets, 0);
  assert.equal(s.score, 0);
});

test("las acciones de coach salen de datos reales y nunca exceden lo que falta", () => {
  const actions = suggestCoachActions({
    goals: [
      { id: "a", name: "Viaje", targetCents: 100000, savedCents: 90000, status: "active" },
      { id: "b", name: "Auto", targetCents: 1000000, savedCents: 0, status: "active" },
      { id: "c", name: "Vieja", targetCents: 100, savedCents: 0, status: "archived" },
    ],
    budgets: [{ category: "Compras", amountCents: 100000, spentCents: 130000 }],
    balanceCents: 500000,
  });
  assert.equal(actions.length, 3);
  assert.equal(actions[0].type, "review_budget", "un presupuesto excedido va primero");

  const first = actions[1];
  assert.equal(first.type, "contribute_goal");
  if (first.type !== "contribute_goal") throw new Error("tipo inesperado");
  assert.equal(first.goalId, "a", "la meta más cercana a cumplirse va antes");
  // Falta $100: el 10% redondeado a $50 daría $50, y eso no excede lo faltante.
  assert.equal(first.amountCents, 5000);
  assert.ok(first.label.includes("Viaje"));

  assert.ok(
    !actions.some((a) => a.type === "contribute_goal" && a.goalId === "c"),
    "una meta archivada no genera sugerencias",
  );
});

test("una meta casi completa no sugiere aportar de más", () => {
  const [action] = suggestCoachActions({
    goals: [{ id: "a", name: "Casi", targetCents: 100000, savedCents: 99000, status: "active" }],
    budgets: [],
    balanceCents: 0,
  });
  assert.equal(action.type, "contribute_goal");
  if (action.type !== "contribute_goal") throw new Error("tipo inesperado");
  assert.equal(action.amountCents, 1000, "solo lo que falta: $10, no el mínimo de $50");
});

test("sin metas pendientes y con saldo se invita a crear la primera", () => {
  const actions = suggestCoachActions({ goals: [], budgets: [], balanceCents: 100 });
  assert.deepEqual(actions.map((a) => a.type), ["create_goal"]);
  assert.equal(suggestCoachActions({ goals: [], budgets: [], balanceCents: 0 }).length, 0);
});
