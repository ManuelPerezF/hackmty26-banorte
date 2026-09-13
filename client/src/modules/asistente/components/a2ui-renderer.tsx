'use client';
import { PeriodComparison, KnowledgeFacts } from './adaptive-blocks';
import { KnowledgeSources } from './knowledge-sources';
import { GoalList, GoalConfirmation } from './goal-blocks';
import { CardList, SavingsBlock } from './financial-blocks';
import {
  ForecastBlock,
  BudgetListBlock,
  HealthScoreBlock,
  CoachActionsBlock,
} from './planning-blocks';
import { formText } from '@/shared/api/client';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/button';
import { formatMoney, formatMovementDate } from '@/shared/utils/money';
import { MovimientoForm } from '@/modules/movimientos/components/movimientoForm';
import { parseAmountCents } from '@/modules/movimientos/services/movimientos.service';
import { useBank } from '@/modules/cuentas/context/bank-context';
import {
  decodeSurface,
  dataAt,
  type Turn,
  type UiAction,
  type Component,
} from '../types/protocol';
const cents = z.number().int();
const movement = z.object({
  id: z.string(),
  description: z.string(),
  amountCents: cents,
  type: z.enum(['income', 'expense']),
  date: z.string(),
  card: z
    .object({ last4: z.string(), product: z.object({ name: z.string() }) })
    .nullable()
    .optional(),
  account: z.object({ name: z.string() }).optional(),
});
function Period({
  data,
  onSubmit,
  disabled,
}: {
  data: unknown;
  onSubmit: (values: { from: string; to: string }) => void;
  disabled: boolean;
}) {
  const p = z.object({ from: z.string(), to: z.string() }).parse(data);
  return (
    <form
      className="chat-period"
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        onSubmit({ from: formText(d, 'from'), to: formText(d, 'to') });
      }}
    >
      <label>
        Desde
        <input
          name="from"
          type="date"
          defaultValue={p.from}
          required
          disabled={disabled}
        />
      </label>
      <label>
        Hasta
        <input
          name="to"
          type="date"
          defaultValue={p.to}
          required
          disabled={disabled}
        />
      </label>
      <Button type="submit" variant="ghost" disabled={disabled}>
        Actualizar periodo
      </Button>
    </form>
  );
}
function UiBlock({
  component,
  data,
  turn,
  disabled,
  latest,
  onAction,
}: {
  component: Component;
  data: unknown;
  turn: Turn;
  disabled: boolean;
  latest: boolean;
  onAction: (a: UiAction) => Promise<boolean>;
}) {
  const bank = useBank();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (
      ![
        'BanorteConfirmation',
        'BanorteGoalConfirmation',
        'BanorteContributionConfirmation',
      ].includes(
        component.component,
      )
    )
      return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [component.component]);
  const [formError, setFormError] = useState('');
  const action = (event: string, extra: Partial<UiAction> = {}) =>
    onAction({ event, surfaceId: turn.id, revision: turn.revision, ...extra });
  if (component.component === 'Text')
    return component.variant === 'h2' ? (
      <h3>{component.text}</h3>
    ) : (
      <p className="chat-prose">{component.text}</p>
    );
  if (component.component === 'BanortePeriodComparison')
    return <PeriodComparison data={data} />;
  if (component.component === 'BanorteKnowledgeFacts')
    return <KnowledgeFacts data={data} />;
  if (component.component === 'BanorteSources')
    return <KnowledgeSources data={data} />;
  if (component.component === 'BanorteCardList')
    return <CardList data={data} />;
  if (component.component === 'BanorteGoalList')
    return (
      <GoalList data={data} disabled={disabled || !latest} onAction={action} />
    );
  if (component.component === 'BanorteGoalConfirmation')
    return (
      <GoalConfirmation
        data={data}
        turn={turn}
        disabled={disabled}
        now={now}
        onAction={action}
      />
    );
  if (component.component === 'BanorteSavingsSimulator')
    return (
      <SavingsBlock
        data={data}
        disabled={disabled || !latest}
        onSubmit={(values) => action('simulate_savings', { values })}
      />
    );
  if (component.component === 'BanorteBalance') {
    const b = z
      .object({ balanceCents: cents, incomeCents: cents, expenseCents: cents })
      .parse(data);
    return (
      <div className="chat-balance">
        <span>Dinero disponible</span>
        <strong>
          {formatMoney(b.balanceCents)} <small>MXN</small>
        </strong>
        <dl>
          <div>
            <dt>Ingresos</dt>
            <dd>{formatMoney(b.incomeCents)}</dd>
          </div>
          <div>
            <dt>Gastos</dt>
            <dd>{formatMoney(b.expenseCents)}</dd>
          </div>
        </dl>
      </div>
    );
  }
  if (component.component === 'BanorteMovementTable') {
    const result = z
      .object({
        items: z.array(movement),
        total: z.number(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
        drilldown: z
          .object({ category: z.string().nullable(), label: z.string() })
          .optional(),
      })
      .parse(data);
    return (
      <div className="chat-table-wrap">
        <table>
          <caption>
            {result.drilldown?.label ?? 'Movimientos'} · {result.total} en el
            periodo
          </caption>
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Cuenta / tarjeta</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((m) => (
              <tr key={m.id}>
                <td>
                  {m.description}
                  <small>{formatMovementDate(m.date)}</small>
                </td>
                <td>
                  {m.card
                    ? `${m.card.product.name} · ${m.card.last4}`
                    : (m.account?.name ?? 'Cuenta personal')}
                </td>
                <td>
                  {m.type === 'income' ? '+' : '−'}
                  {formatMoney(m.amountCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!result.items.length && <p>No hay movimientos en este periodo.</p>}
        {result.drilldown && result.total > result.pageSize && (
          <div className="chat-goal-actions">
            <Button
              variant="ghost"
              disabled={disabled || !latest || result.page <= 1}
              onClick={() => {
                void action('select_category', {
                  values: {
                    category: result.drilldown!.category,
                    page: result.page - 1,
                  },
                });
              }}
            >
              Anterior
            </Button>
            <span>
              Página {result.page} de{' '}
              {Math.ceil(result.total / result.pageSize)}
            </span>
            <Button
              variant="ghost"
              disabled={
                disabled ||
                !latest ||
                result.page * result.pageSize >= result.total
              }
              onClick={() => {
                void action('select_category', {
                  values: {
                    category: result.drilldown!.category,
                    page: result.page + 1,
                  },
                });
              }}
            >
              Siguiente
            </Button>
          </div>
        )}
        {!result.drilldown && result.total > result.items.length && (
          <small>
            Mostrando {result.items.length} de {result.total} movimientos.
          </small>
        )}
      </div>
    );
  }
  if (component.component === 'BanorteSpendingChart') {
    const result = z
      .object({
        period: z.object({ from: z.string(), to: z.string() }),
        totals: z.object({ expenseCents: cents }),
        selectedCategory: z.string().nullable().optional(),
        categories: z.array(
          z.object({
            category: z.string(),
            expenseCents: cents,
            share: z.number().min(0).max(1),
          }),
        ),
      })
      .parse(data);
    return (
      <figure className="chat-chart">
        <figcaption>
          Gastos por categoría{' '}
          <small>
            {formatMovementDate(result.period.from)} –{' '}
            {formatMovementDate(result.period.to)}
          </small>
        </figcaption>
        <strong>{formatMoney(result.totals.expenseCents)}</strong>
        <p className="chat-chart-help">
          Selecciona una categoría para ver sus movimientos.
        </p>
        <Button
          variant="ghost"
          disabled={disabled || !latest}
          aria-pressed={!result.selectedCategory}
          onClick={() => {
            void action('select_category', {
              values: { category: null, page: 1 },
            });
          }}
        >
          Ver todos los gastos
        </Button>
        {result.categories.map((c) => (
          <button
            type="button"
            className="chat-chart-row"
            key={c.category}
            disabled={disabled || !latest}
            aria-pressed={result.selectedCategory === c.category}
            aria-label={`Ver movimientos de ${c.category}`}
            onClick={() => {
              void action('select_category', {
                values: { category: c.category, page: 1 },
              });
            }}
          >
            <div>
              <span>{c.category}</span>
              <b>{formatMoney(c.expenseCents)}</b>
            </div>
            <meter
              min={0}
              max={1}
              value={c.share}
              aria-label={`${c.category}: ${Math.round(c.share * 100)}%`}
            />
          </button>
        ))}
        {!result.categories.length && (
          <p>No registraste gastos en este periodo.</p>
        )}
      </figure>
    );
  }
  if (component.component === 'BanortePeriodSelector')
    return (
      <Period
        data={data}
        disabled={disabled || !latest}
        onSubmit={(values) => {
          void action('change_period', { values });
        }}
      />
    );
  if (component.component === 'BanorteMovementForm') {
    const { draft = {} } = z
      .object({
        draft: z
          .object({
            cardId: z.uuid().nullable().optional(),
            description: z.string().max(80).optional(),
            amountCents: z
              .number()
              .int()
              .positive()
              .max(99999999999)
              .optional(),
            type: z.enum(['income', 'expense']).optional(),
            category: z.string().optional(),
            date: z.iso.date().optional(),
            notes: z.string().max(500).optional(),
          })
          .optional(),
      })
      .parse(data);
    return (
      <div className="chat-movement-form">
        <MovimientoForm
          initialInstrument={draft.cardId ?? ''}
          requireInstrumentSelection={!draft.cardId}
          initialValues={{
            ...draft,
            amount:
              draft.amountCents === undefined
                ? undefined
                : (draft.amountCents / 100).toFixed(2),
          }}
          ready={!disabled && latest}
          error={formError}
          onCancel={() => setFormError('Puedes continuar con otra pregunta.')}
          onRegister={async (input) => {
            try {
              const ok = await action('submit_movement_form', {
                values: {
                  description: input.description,
                  type: input.type,
                  category: input.category,
                  date: input.date,
                  notes: input.notes,
                  amountCents: parseAmountCents(input.amount),
                  cardId:
                    input.instrumentId && input.instrumentId !== bank.account.id
                      ? input.instrumentId
                      : null,
                },
              });
              if (!ok)
                setFormError(
                  'No se pudo preparar el movimiento. Revisa el aviso de la conversación.',
                );
              return ok;
            } catch (e) {
              setFormError(
                e instanceof Error ? e.message : 'Revisa los datos.',
              );
              return false;
            }
          }}
        />
      </div>
    );
  }
  if (component.component === 'BanorteConfirmation') {
    const c = z
      .object({
        actionId: z.string(),
        description: z.string(),
        amountCents: cents,
        type: z.enum(['income', 'expense']),
        date: z.string(),
        cardId: z.string().nullable().optional(),
      })
      .parse(data);
    const pending = turn.pendingActions.find((p) => p.id === c.actionId);
    const unavailable =
      !pending ||
      !['pending', 'executing'].includes(pending.status) ||
      (pending.status === 'pending' && pending.expiresAt < now);
    const card = bank.cards.find((card) => card.id === c.cardId);
    return (
      <section className="chat-confirm">
        <h4>Revisa antes de guardar</h4>
        <dl>
          <div>
            <dt>Concepto</dt>
            <dd>{c.description}</dd>
          </div>
          <div>
            <dt>Monto</dt>
            <dd>
              {formatMoney(c.amountCents)} ·{' '}
              {c.type === 'income' ? 'Ingreso' : 'Gasto'}
            </dd>
          </div>
          <div>
            <dt>Cuenta / tarjeta</dt>
            <dd>
              {card
                ? `${card.product.name} · ${card.last4}`
                : bank.account.name}
            </dd>
          </div>
          <div>
            <dt>Fecha</dt>
            <dd>{formatMovementDate(c.date)}</dd>
          </div>
        </dl>
        {unavailable ? (
          <p>
            {pending?.status === 'completed'
              ? 'Movimiento guardado.'
              : pending?.status === 'cancelled'
                ? 'Registro cancelado.'
                : 'Esta confirmación ya no está disponible.'}
          </p>
        ) : (
          <div>
            <Button
              className="button"
              disabled={disabled}
              onClick={() => {
                void action('confirm_movement', { actionId: c.actionId });
              }}
            >
              Confirmar movimiento
            </Button>
            <Button
              variant="ghost"
              disabled={disabled || pending?.status !== 'pending'}
              onClick={() => {
                void action('cancel_movement', { actionId: c.actionId });
              }}
            >
              Cancelar
            </Button>
          </div>
        )}
      </section>
    );
  }
  if (component.component === 'BanorteForecast') return <ForecastBlock data={data} />;
  if (component.component === 'BanorteBudgetList')
    return <BudgetListBlock data={data} />;
  if (component.component === 'BanorteHealthScore')
    return <HealthScoreBlock data={data} />;
  if (component.component === 'BanorteCoachActions')
    return (
      <CoachActionsBlock
        data={data}
        disabled={disabled || !latest}
        onAction={(event, payload) => void action(event, payload)}
      />
    );
  if (component.component === 'BanorteContributionConfirmation') {
    const c = z
      .object({
        actionId: z.string(),
        goalId: z.string(),
        goalName: z.string(),
        amountCents: cents,
        targetCents: cents,
        savedCents: cents,
      })
      .parse(data);
    const pending = turn.pendingActions.find((p) => p.id === c.actionId);
    const unavailable =
      !pending ||
      !['pending', 'executing'].includes(pending.status) ||
      (pending.status === 'pending' && pending.expiresAt < now);
    return (
      <section className="chat-confirm">
        <h4>Confirma tu aportación</h4>
        <dl>
          <div>
            <dt>Meta</dt>
            <dd>{c.goalName}</dd>
          </div>
          <div>
            <dt>Aportación</dt>
            <dd>{formatMoney(c.amountCents)}</dd>
          </div>
          <div>
            <dt>Avance</dt>
            <dd>
              {formatMoney(c.savedCents)} de {formatMoney(c.targetCents)}
            </dd>
          </div>
        </dl>
        {unavailable ? (
          <p>
            {pending?.status === 'completed'
              ? 'Aportación registrada.'
              : pending?.status === 'cancelled'
                ? 'Aportación cancelada.'
                : 'Esta confirmación ya no está disponible.'}
          </p>
        ) : (
          <div>
            <Button
              className="button"
              disabled={disabled}
              onClick={() => {
                void action('confirm_contribution', { actionId: c.actionId });
              }}
            >
              Confirmar aportación
            </Button>
            <Button
              variant="ghost"
              disabled={disabled || pending?.status !== 'pending'}
              onClick={() => {
                void action('cancel_contribution', { actionId: c.actionId });
              }}
            >
              Cancelar
            </Button>
          </div>
        )}
        <small>Registra avance de tu plan. No mueve dinero de tu cuenta.</small>
      </section>
    );
  }
  if (component.component === 'BanorteActionResult') {
    // El mismo componente sirve a dos escrituras confirmadas; cada una trae su
    // propia forma y se distinguen explícitamente.
    const contribution = z
      .object({
        contributedCents: cents,
        goal: z.object({
          name: z.string(),
          savedCents: cents,
          targetCents: cents,
        }),
      })
      .safeParse(data);
    if (contribution.success) {
      const { goal, contributedCents } = contribution.data;
      return (
        <output className="chat-result">
          <strong>Aportación registrada</strong>
          <p>
            {goal.name} · {formatMoney(contributedCents)}
          </p>
          <small>
            Llevas {formatMoney(goal.savedCents)} de{' '}
            {formatMoney(goal.targetCents)} en tu plan.
          </small>
        </output>
      );
    }
    const m = movement.parse(data);
    return (
      <output className="chat-result">
        <strong>Movimiento guardado</strong>
        <p>
          {m.description} · {formatMoney(m.amountCents)}
        </p>
        <small>Ya forma parte de tu historial.</small>
      </output>
    );
  }
  return null;
}
export function A2uiRenderer({
  turn,
  disabled,
  latest,
  onAction,
}: {
  turn: Turn;
  disabled: boolean;
  latest: boolean;
  onAction: (a: UiAction) => Promise<boolean>;
}) {
  let surface: ReturnType<typeof decodeSurface>;
  try {
    surface = decodeSurface(turn);
  } catch {
    return (
      <p role="alert">
        Esta interfaz no es compatible. Consulta el historial para verificar el
        resultado.
      </p>
    );
  }
  return (
    <div className="chat-generated">
      {surface.components.map((component) => (
        <SafeBlock
          key={component.id}
          component={component}
          data={
            'data' in component
              ? dataAt(surface.data, component.data.path)
              : undefined
          }
          turn={turn}
          disabled={disabled}
          latest={latest}
          onAction={onAction}
        />
      ))}
    </div>
  );
}
// Validate data before entering React child rendering, so malformed server payloads never become HTML/code.
import { Component as ReactComponent, type ReactNode } from 'react';
class BlockBoundary extends ReactComponent<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p role="alert">
        No se pudo mostrar este bloque. Tus datos guardados no se modificaron.
      </p>
    ) : (
      this.props.children
    );
  }
}
function SafeBlock(props: Parameters<typeof UiBlock>[0]) {
  return (
    <BlockBoundary>
      <UiBlock {...props} />
    </BlockBoundary>
  );
}
