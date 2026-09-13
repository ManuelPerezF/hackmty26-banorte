'use client';
import {
  budgetsSchema,
  coachSchema,
  forecastSchema,
  healthSchema,
  rewardsSchema,
} from './planning-schemas';
import { formatMovementDate } from '@/shared/utils/money';
import { Button } from '@/shared/components/ui/button';
import { formatMoney } from '@/shared/utils/money';

export function ForecastBlock({ data }: { data: unknown }) {
  const f = forecastSchema.parse(data);
  // La barra compara proyección contra presupuesto; sin presupuesto no hay
  // referencia y se omite en vez de inventar un 100%.
  const width =
    f.budgetUsagePct === null ? null : Math.min(100, Math.max(2, f.budgetUsagePct));
  return (
    <section className="chat-forecast" aria-label="Proyección de cierre de mes">
      <h4>Proyección al cierre del mes</h4>
      <strong className="chat-forecast-total">
        {formatMoney(f.projectedTotalCents)} <small>MXN</small>
      </strong>
      <p className="chat-forecast-basis">
        Llevas {formatMoney(f.spentCents)} en {f.daysElapsed}{' '}
        {f.daysElapsed === 1 ? 'día' : 'días'} ({formatMoney(f.dailyAverageCents)} al
        día). Quedan {f.daysRemaining}{' '}
        {f.daysRemaining === 1 ? 'día' : 'días'}.
      </p>
      {width !== null && (
        <div className="chat-forecast-bar">
          <span
            style={{ width: `${width}%` }}
            data-state={
              f.budgetUsagePct! >= 100
                ? 'exceeded'
                : f.budgetUsagePct! >= 80
                  ? 'warning'
                  : 'on_track'
            }
          />
        </div>
      )}
      <dl className="chat-forecast-parts">
        <div>
          <dt>Gasto variable estimado</dt>
          <dd>{formatMoney(f.projectedVariableCents)}</dd>
        </div>
        <div>
          <dt>Cargos fijos pendientes</dt>
          <dd>{formatMoney(f.pendingFixedCents)}</dd>
        </div>
        {f.budgetUsagePct !== null && (
          <div>
            <dt>Contra tu presupuesto</dt>
            <dd>
              {f.budgetUsagePct}% de {formatMoney(f.budgetTotalCents)}
            </dd>
          </div>
        )}
      </dl>
      <small>
        Estimación a partir de tu ritmo de gasto y tus cargos fijos. No incluye
        gastos atípicos ni inflación.
      </small>
    </section>
  );
}

const budgetLabel = {
  on_track: 'En curso',
  warning: 'Cerca del límite',
  exceeded: 'Excedido',
} as const;

export function BudgetListBlock({ data }: { data: unknown }) {
  const budgets = budgetsSchema.parse(data);
  if (!budgets.items.length)
    return (
      <section className="chat-budgets" aria-label="Presupuestos">
        <h4>Presupuestos</h4>
        <p>
          Todavía no defines límites por categoría. Cuando los configures, aquí
          verás cuánto llevas gastado de cada uno.
        </p>
      </section>
    );
  return (
    <section className="chat-budgets" aria-label="Presupuestos del mes">
      <h4>
        Presupuestos del mes <span>{budgets.items.length}</span>
      </h4>
      <ul>
        {budgets.items.map((b) => (
          <li key={b.id} data-state={b.status}>
            <div className="chat-budget-head">
              <strong>{b.category}</strong>
              <span className="chat-budget-chip">{budgetLabel[b.status]}</span>
            </div>
            <div className="chat-budget-bar">
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
      <small>
        Gastado {formatMoney(budgets.totalSpentCents)} de{' '}
        {formatMoney(budgets.totalLimitCents)} presupuestados.
      </small>
    </section>
  );
}

export function HealthScoreBlock({ data }: { data: unknown }) {
  const health = healthSchema.parse(data);
  const parts = [
    { label: 'Tasa de ahorro', value: health.breakdown.savings, max: 40 },
    { label: 'Presupuestos', value: health.breakdown.budgets, max: 35 },
    { label: 'Metas', value: health.breakdown.goals, max: 25 },
  ];
  return (
    <section className="chat-health" aria-label="Salud financiera">
      <h4>Tu salud financiera</h4>
      <div className="chat-health-figure">
        <strong>{health.score}</strong>
        <span>de 100 · {health.grade}</span>
      </div>
      <ul>
        {parts.map((p) => (
          <li key={p.label}>
            <div>
              <span>{p.label}</span>
              <span className="chat-health-points">
                {p.value}/{p.max}
              </span>
            </div>
            <div className="chat-health-bar">
              <span style={{ width: `${(p.value / p.max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      {/* El desglose evita que la cifra se lea como un veredicto opaco. */}
      <small>
        {!health.basis.hasIncome && 'Sin ingresos registrados este mes. '}
        {health.basis.budgetCount === 0 &&
          'Sin presupuestos configurados se otorga la mitad de esos puntos. '}
        {health.basis.goalCount === 0 && 'Crear una meta suma hasta 25 puntos.'}
      </small>
    </section>
  );
}

export function CoachActionsBlock({
  data,
  disabled,
  onAction,
}: {
  data: unknown;
  disabled: boolean;
  onAction: (
    event: string,
    payload: { values: { goalId: string; amountCents: number } },
  ) => void;
}) {
  const coach = coachSchema.parse(data);
  if (!coach.items.length) return null;
  return (
    <section className="chat-coach" aria-label="Acciones sugeridas">
      <h4>Siguientes pasos</h4>
      <ul>
        {coach.items.map((a) => (
          <li key={a.label}>
            {a.type === 'contribute_goal' ? (
              <Button
                variant="outline"
                disabled={disabled}
                onClick={() =>
                  onAction('prepare_contribution', {
                    values: { goalId: a.goalId, amountCents: a.amountCents },
                  })
                }
              >
                {a.label}
              </Button>
            ) : (
              <span className="chat-coach-note">{a.label}</span>
            )}
          </li>
        ))}
      </ul>
      <small>
        Sugerencias calculadas con tus propios datos. Ninguna se aplica sin que
        la confirmes.
      </small>
    </section>
  );
}

const PRODUCT_LABEL: Record<string, string> = {
  clasica: 'Clásica',
  oro: 'Oro',
  platinum: 'Platinum',
};

export function RewardPointsBlock({ data }: { data: unknown }) {
  const r = rewardsSchema.parse(data);
  const withRate = r.cards.filter((c) => c.pointsPer10Pesos !== null);
  const best = [...r.hypothetical].sort((a, b) => b.points - a.points)[0];
  const ownedBest = r.hypothetical
    .filter((h) => h.owned)
    .sort((a, b) => b.points - a.points)[0];
  return (
    <section className="chat-points" aria-label="Puntos de recompensa">
      <h4>Puntos Recompensa Total</h4>
      <div className="chat-points-figure">
        <strong>{r.totalPoints.toLocaleString('es-MX')}</strong>
        <span>
          puntos · {formatMovementDate(r.period.from)} –{' '}
          {formatMovementDate(r.period.to)}
        </span>
      </div>
      {r.cards.length ? (
        <ul>
          {r.cards.map((c) => (
            <li key={c.cardId}>
              <div className="chat-points-row">
                <strong>
                  {c.productName} ····{c.last4}
                </strong>
                <span className="chat-points-value">
                  {c.points === null ? '—' : c.points.toLocaleString('es-MX')}{' '}
                  pts
                </span>
              </div>
              <small>
                {formatMoney(c.spentCents)} en {c.purchases}{' '}
                {c.purchases === 1 ? 'compra' : 'compras'}
                {c.pointsPer10Pesos !== null && c.source
                  ? ` · ${c.pointsPer10Pesos} pts por $10 — ${c.source.title}, p. ${c.source.page}` +
                    (c.source.validTo
                      ? ` (vigente hasta ${formatMovementDate(c.source.validTo)})`
                      : '')
                  : ' · sin tasa documentada para este producto'}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p>No tienes tarjetas asignadas; los puntos se generan por compras con tarjeta.</p>
      )}
      {/* La comparación vuelve concreta la diferencia entre productos: es la
          misma compra, solo cambia el plástico. Se marca cuál ya tienes. */}
      {r.totalSpentCents > 0 && best && ownedBest && best.product !== ownedBest.product && (
        <p className="chat-points-hint">
          Con el mismo gasto, una {PRODUCT_LABEL[best.product] ?? best.product}{' '}
          habría generado {best.points.toLocaleString('es-MX')} puntos (
          {best.pointsPer10Pesos} por $10) frente a{' '}
          {ownedBest.points.toLocaleString('es-MX')} de tu{' '}
          {PRODUCT_LABEL[ownedBest.product] ?? ownedBest.product}.
        </p>
      )}
      <small>
        Estimación con la tasa publicada por producto; requiere inscripción al
        programa. Solo cuentan compras con tarjeta, no ingresos ni cargos a
        cuenta.{withRate.length === 0 && ' No se encontró tasa en los documentos.'}
      </small>
    </section>
  );
}
