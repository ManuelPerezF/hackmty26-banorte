'use client';
import { useState } from 'react';
import { Trash2, Plus, ArrowUpRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { formText } from '@/shared/api/client';
import { formatMoney } from '@/shared/utils/money';
import { parseAmountCents } from '@/modules/movimientos/services/movimientos.service';
import { usePlaneacion, type Budget } from '../hooks/usePlaneacion';
import '../styles/plan.css';

const CATEGORIES = [
  'Vivienda',
  'Alimentación',
  'Transporte',
  'Entretenimiento',
  'Compras',
  'Servicios',
  'Otros',
];

const STATUS_LABEL = {
  on_track: 'En curso',
  warning: 'Cerca del límite',
  exceeded: 'Excedido',
} as const;

/** Un límite propuesto: lo gastado redondeado arriba al siguiente $500. */
const suggestLimit = (spentCents: number) =>
  Math.max(50000, Math.ceil(spentCents / 50000) * 50000);

type OpenForm =
  | { kind: 'budget'; category?: string; amountCents?: number }
  | { kind: 'recurrence' }
  | null;

export function PlanPanel() {
  const plan = usePlaneacion();
  const [openForm, setOpenForm] = useState<OpenForm>(null);

  if (plan.loading)
    return (
      <section className="plan-view">
        <output>Cargando tu plan…</output>
      </section>
    );

  const budgeted = new Set(plan.budgets.map((b) => b.category));
  // Categorías con gasto real este mes y sin límite: ahí es donde un
  // presupuesto cambia algo. Nómina es ingreso y nunca se presupuesta.
  const unbudgeted = plan.spending.filter(
    (c) => c.category !== 'Nómina' && !budgeted.has(c.category),
  );
  const f = plan.forecast;
  const h = plan.health;
  const budgetForm = openForm?.kind === 'budget' ? openForm : null;

  return (
    <section className="plan-view" aria-label="Tu plan del mes">
      {plan.error && (
        <p className="plan-error" role="alert">
          {plan.error}
        </p>
      )}

      <div className="plan-summary">
        {f && (
          <article className="plan-card plan-forecast">
            <span className="plan-kicker">Proyección al cierre del mes</span>
            <strong>{formatMoney(f.projectedTotalCents)}</strong>
            <p>
              Llevas {formatMoney(f.spentCents)} en {f.daysElapsed}{' '}
              {f.daysElapsed === 1 ? 'día' : 'días'} — unos{' '}
              {formatMoney(f.dailyAverageCents)} diarios. Quedan{' '}
              {f.daysRemaining} {f.daysRemaining === 1 ? 'día' : 'días'}.
            </p>
            {f.budgetUsagePct !== null ? (
              <>
                <div
                  className="plan-bar plan-bar-forecast"
                  data-state={
                    f.budgetUsagePct >= 100
                      ? 'exceeded'
                      : f.budgetUsagePct >= 80
                        ? 'warning'
                        : 'on_track'
                  }
                >
                  <span style={{ width: `${Math.min(100, f.budgetUsagePct)}%` }} />
                </div>
                <small>
                  {f.budgetUsagePct}% de tus {formatMoney(f.budgetTotalCents)}{' '}
                  presupuestados
                  {f.pendingFixedCents > 0 &&
                    ` · incluye ${formatMoney(f.pendingFixedCents)} de cargos fijos por caer`}
                  .
                </small>
              </>
            ) : (
              <small>
                {f.pendingFixedCents > 0
                  ? `Incluye ${formatMoney(f.pendingFixedCents)} de cargos fijos por caer. `
                  : 'Solo gasto variable: aún no registras cargos fijos. '}
                Sin presupuestos no hay contra qué comparar la proyección.
              </small>
            )}
          </article>
        )}

        {h && (
          <article className="plan-card plan-health">
            <span className="plan-kicker">Salud financiera del mes</span>
            <div className="plan-health-figure">
              <strong>{h.score}</strong>
              <span>
                de 100
                <br />
                {h.grade}
              </span>
            </div>
            <ul className="plan-health-parts">
              {[
                { label: 'Tasa de ahorro', value: h.breakdown.savings, max: 40 },
                { label: 'Presupuestos', value: h.breakdown.budgets, max: 35 },
                { label: 'Metas', value: h.breakdown.goals, max: 25 },
              ].map((p) => (
                <li key={p.label}>
                  <div>
                    <span>{p.label}</span>
                    <span>
                      {p.value}/{p.max}
                    </span>
                  </div>
                  <div className="plan-bar">
                    <span style={{ width: `${(p.value / p.max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <small>
              {h.basis.hasIncome
                ? `Ingresos ${formatMoney(h.incomeCents)} · gastos ${formatMoney(h.expenseCents)}.`
                : 'Sin ingresos registrados este mes.'}{' '}
              {h.basis.budgetCount === 0 &&
                'Sin presupuestos se otorga la mitad de esos puntos. '}
              {h.basis.goalCount === 0 && 'Una meta suma hasta 25 puntos.'}
            </small>
          </article>
        )}
      </div>

      <div className="plan-section">
        <header>
          <h3>Presupuestos por categoría</h3>
          <Button
            variant="ghost"
            disabled={plan.busy}
            onClick={() => setOpenForm(budgetForm ? null : { kind: 'budget' })}
          >
            <Plus size={16} /> Nuevo
          </Button>
        </header>
        {budgetForm && (
          <form
            className="plan-form"
            key={`${budgetForm.category ?? ''}-${budgetForm.amountCents ?? ''}`}
            onSubmit={async (e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const amount = parseAmountCents(formText(data, 'amount'));
              if (await plan.setBudget(formText(data, 'category'), amount))
                setOpenForm(null);
            }}
          >
            <label>
              Categoría
              <select name="category" required defaultValue={budgetForm.category}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Límite mensual (MXN)
              <input
                name="amount"
                inputMode="decimal"
                required
                defaultValue={
                  budgetForm.amountCents !== undefined
                    ? (budgetForm.amountCents / 100).toFixed(2)
                    : ''
                }
              />
            </label>
            <Button className="button" type="submit" disabled={plan.busy}>
              Guardar
            </Button>
          </form>
        )}
        {plan.budgets.length > 0 && (
          <ul className="plan-list">
            {plan.budgets.map((b: Budget) => (
              <li key={b.id} data-state={b.status}>
                <div className="plan-row">
                  <strong>{b.category}</strong>
                  <span className="plan-chip">{STATUS_LABEL[b.status]}</span>
                  <button
                    type="button"
                    className="plan-remove"
                    aria-label={`Quitar presupuesto de ${b.category}`}
                    disabled={plan.busy}
                    onClick={() => void plan.removeBudget(b.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="plan-bar">
                  <span style={{ width: `${Math.min(100, b.usagePct)}%` }} />
                </div>
                <small>
                  {formatMoney(b.spentCents)} de {formatMoney(b.limitCents)} ·{' '}
                  {b.remainingCents >= 0
                    ? `${formatMoney(b.remainingCents)} disponibles`
                    : `${formatMoney(Math.abs(b.remainingCents))} por encima`}
                </small>
              </li>
            ))}
          </ul>
        )}
        {unbudgeted.length > 0 && (
          <div className="plan-suggest">
            <span className="plan-kicker">
              {plan.budgets.length
                ? 'Gasto de este mes sin límite'
                : 'Empieza por donde ya gastas'}
            </span>
            <ul>
              {unbudgeted.slice(0, 4).map((c) => (
                <li key={c.category}>
                  <button
                    type="button"
                    disabled={plan.busy}
                    onClick={() =>
                      setOpenForm({
                        kind: 'budget',
                        category: c.category,
                        amountCents: suggestLimit(c.expenseCents),
                      })
                    }
                  >
                    <span>
                      <strong>{c.category}</strong>
                      <small>
                        {formatMoney(c.expenseCents)} este mes ·{' '}
                        {Math.round(c.share * 100)}% de tu gasto
                      </small>
                    </span>
                    <span className="plan-suggest-cta">
                      Poner límite <ArrowUpRight size={14} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {plan.budgets.length === 0 && unbudgeted.length === 0 && (
          <p className="plan-empty">
            Define un límite por categoría para saber no solo cuánto gastaste,
            sino cuánto te pasaste. Cuando registres gastos, aquí verás por
            dónde empezar.
          </p>
        )}
      </div>

      <div className="plan-section">
        <header>
          <h3>Cargos fijos</h3>
          <Button
            variant="ghost"
            disabled={plan.busy}
            onClick={() =>
              setOpenForm(
                openForm?.kind === 'recurrence' ? null : { kind: 'recurrence' },
              )
            }
          >
            <Plus size={16} /> Nuevo
          </Button>
        </header>
        {openForm?.kind === 'recurrence' && (
          <form
            className="plan-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const saved = await plan.addRecurrence({
                description: formText(data, 'description'),
                category: formText(data, 'category'),
                amountCents: parseAmountCents(formText(data, 'amount')),
                type: formText(data, 'type') === 'income' ? 'income' : 'expense',
                dayOfMonth: Number(formText(data, 'day')),
              });
              if (saved) setOpenForm(null);
            }}
          >
            <label>
              Concepto
              <input name="description" maxLength={80} required />
            </label>
            <label>
              Monto (MXN)
              <input name="amount" inputMode="decimal" required />
            </label>
            <label>
              Categoría
              <select name="category" required>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo
              <select name="type" required defaultValue="expense">
                <option value="expense">Cargo</option>
                <option value="income">Ingreso</option>
              </select>
            </label>
            <label>
              Día del mes
              {/* 1–28: cualquier día mayor no existe en febrero. */}
              <input name="day" type="number" min={1} max={28} defaultValue={1} required />
            </label>
            <Button className="button" type="submit" disabled={plan.busy}>
              Guardar
            </Button>
          </form>
        )}
        {plan.recurrences.length ? (
          <ul className="plan-list plan-list-plain">
            {plan.recurrences.map((r) => (
              <li key={r.id}>
                <div className="plan-row">
                  <strong>{r.description}</strong>
                  <span className="plan-amount">
                    {r.type === 'income' ? '+' : '−'}
                    {formatMoney(r.amountCents)}
                  </span>
                  <button
                    type="button"
                    className="plan-remove"
                    aria-label={`Quitar ${r.description}`}
                    disabled={plan.busy}
                    onClick={() => void plan.removeRecurrence(r.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <small>
                  {r.category} · día {r.dayOfMonth} de cada mes
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <div className="plan-empty-card">
            <p>
              Renta, suscripciones, nómina. Con ellos la proyección deja de ver
              solo el gasto variable y anticipa lo que aún no ha caído.
            </p>
            <Button
              variant="outline"
              disabled={plan.busy}
              onClick={() => setOpenForm({ kind: 'recurrence' })}
            >
              <Plus size={16} /> Agregar mi primer cargo fijo
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
