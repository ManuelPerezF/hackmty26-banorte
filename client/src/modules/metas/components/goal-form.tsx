'use client';
import { useState } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { formatMoney, formatMovementDate } from '@/shared/utils/money';
import { parseAmountCents } from '@/modules/movimientos/services/movimientos.service';
import type { Goal } from '@/shared/api/types';
import type { GoalInput } from '../types/metas.types';
import { goalPlan } from '../services/goal-plan';
export function GoalForm({
  initial,
  name: initialName,
  busy,
  today,
  onSave,
  onCancel,
}: {
  initial?: Goal;
  name?: string;
  busy: boolean;
  today: string;
  onSave: (input: GoalInput) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? initialName ?? '');
  const [amount, setAmount] = useState(
    initial ? (initial.targetCents / 100).toFixed(2) : '',
  );
  const [deadline, setDeadline] = useState(initial?.deadline ?? '');
  const [error, setError] = useState('');
  let targetCents = 0;
  try {
    targetCents = parseAmountCents(amount);
  } catch {
    /* Empty or partial input has no preview. */
  }
  const plan = goalPlan(targetCents, deadline || null, today);
  return (
    <div className="goal-detail-layout">
      <form
        className="goal-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          setError('');
          try {
            const fields = new FormData(event.currentTarget);
            const readField = (key: string) => {
              const value = fields.get(key);
              return typeof value === 'string' ? value : '';
            };
            const cents = parseAmountCents(readField('target'));
            await onSave({
              name: readField('name').trim(),
              target: cents / 100,
              deadline: readField('deadline') || null,
            });
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Revisa el monto.');
          }
        }}
      >
        <fieldset disabled={busy}>
          <legend className="sr-only">Datos de la meta</legend>
          <label htmlFor="goal-name">
            Nombre de tu meta
            <Input
              id="goal-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="Por ejemplo: Mi próximo viaje"
              required
            />
          </label>
          <label htmlFor="goal-target">
            ¿Cuánto quieres reunir? (MXN)
            <Input
              id="goal-target"
              name="target"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              maxLength={12}
              placeholder="Escribe tu monto objetivo"
              required
            />
          </label>
          <label htmlFor="goal-deadline">
            ¿Para cuándo? (opcional)
            <input
              id="goal-deadline"
              name="deadline"
              type="date"
              value={deadline}
              onInput={(e) => setDeadline(e.currentTarget.value)}
              onChange={(e) => setDeadline(e.target.value)}
              min={today}
              max="9999-12-31"
              aria-describedby="goal-date-help"
            />
          </label>
          <p id="goal-date-help" className="goal-field-help">
            Una fecha permite calcular una referencia mensual. Puedes ajustarla
            después.
          </p>
          {error && (
            <p className="goal-error" role="alert">
              {error}
            </p>
          )}
          <div className="goal-actions">
            <Button
              className="button"
              type="submit"
              disabled={busy || !name.trim() || !targetCents}
            >
              {busy
                ? 'Guardando…'
                : initial
                  ? 'Guardar cambios'
                  : 'Guardar meta'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={onCancel}
            >
              Cancelar
            </Button>
          </div>
        </fieldset>
      </form>
      <aside className="goal-next-step" aria-label="Vista previa de la meta">
        <span className="goal-kicker">Así se verá tu plan</span>
        <h3>{name.trim() || 'Tu próxima meta'}</h3>
        <span>Monto objetivo</span>
        <strong className="goal-monthly">
          {targetCents ? formatMoney(targetCents) : 'Por definir'}
        </strong>
        <p>
          {deadline
            ? `Fecha objetivo: ${formatMovementDate(deadline)}`
            : 'Fecha por definir'}
        </p>
        {plan?.status === 'scheduled' && (
          <p className="goal-preview-reference">
            Referencia desde cero:{' '}
            <strong>{formatMoney(plan.monthlyCents!)} al mes</strong> durante
            aproximadamente {plan.months} {plan.months === 1 ? 'mes' : 'meses'},
            sin rendimientos.
          </p>
        )}
        <p className="goal-planning-note">
          Guardar esta meta no aparta ni mueve dinero. Podrás editarla, explorar
          un escenario o archivarla.
        </p>
      </aside>
    </div>
  );
}
