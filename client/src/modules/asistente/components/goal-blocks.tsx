'use client';
import { useState } from 'react';
import { z } from 'zod';
import { GoalCard } from '@/modules/metas/components/goal-card';
import { Button } from '@/shared/components/ui/button';
import { formText } from '@/shared/api/client';
import { formatMoney, formatMovementDate } from '@/shared/utils/money';
import { parseAmountCents } from '@/modules/movimientos/services/movimientos.service';
import type { Turn } from '../types/protocol';
const fields = {
  name: z.string().min(1).max(80),
  targetCents: z.number().int().positive().max(99999999999),
  deadline: z.iso.date().nullable(),
};
const goal = z.object({
  id: z.uuid(),
  ...fields,
  status: z.enum(['active', 'archived']),
  updatedAt: z.number().int().optional(),
});
type Goal = z.infer<typeof goal>;
type Operation = 'create' | 'edit' | 'archive' | 'restore';
type Act = (
  event: string,
  extra: { values?: unknown; actionId?: string },
) => Promise<boolean>;
const labels: Record<Operation, string> = {
  create: 'Crear meta',
  edit: 'Editar meta',
  archive: 'Archivar meta',
  restore: 'Recuperar meta',
};
const draftSchema = z.object({
  operation: z.enum(['create', 'edit', 'archive', 'restore']),
  goalId: z.uuid().optional(),
  name: fields.name.optional(),
  targetCents: fields.targetCents.optional(),
  deadline: fields.deadline.optional(),
});
export function GoalList({
  data,
  disabled,
  onAction,
}: {
  data: unknown;
  disabled: boolean;
  onAction: Act;
}) {
  const list = z
    .object({
      items: z.array(goal),
      total: z.number().int(),
      page: z.number().int().default(1),
      pageSize: z.number().int().default(20),
      status: z.enum(['active', 'archived']).optional(),
      today: z.iso.date().optional(),
      draft: draftSchema.optional(),
    })
    .parse(data);
  const { draft } = list;
  const currentStatus = list.status ?? list.items[0]?.status ?? 'active';
  const [editor, setEditor] = useState<{
    operation: Operation;
    goal?: Goal;
    draft?: z.infer<typeof draftSchema>;
  } | null>(() => {
    if (!draft) return null;
    if (draft.operation === 'create') return { operation: 'create', draft };
    const found = list.items.find((g) => g.id === draft.goalId);
    return found ? { operation: draft.operation, goal: found, draft } : null;
  });
  const [error, setError] = useState('');
  if (editor) {
    const g = editor.goal;
    const editsFields =
      editor.operation === 'create' || editor.operation === 'edit';
    return (
      <section
        className="chat-goal-editor"
        aria-label={labels[editor.operation]}
      >
        <h4>{labels[editor.operation]}</h4>
        <p>
          {editsFields
            ? 'Define tu objetivo. Después podrás revisar y confirmar los datos.'
            : `Revisa el cambio para ${g?.name ?? 'tu meta'}.`}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            const form = new FormData(e.currentTarget);
            try {
              const values = {
                operation: editor.operation,
                ...(g ? { goalId: g.id, expectedUpdatedAt: g.updatedAt } : {}),
                ...(editsFields
                  ? {
                      name: formText(form, 'name').trim(),
                      targetCents: parseAmountCents(formText(form, 'target')),
                      deadline: formText(form, 'deadline') || null,
                    }
                  : {}),
              };
              if (!(await onAction('prepare_goal', { values })))
                setError(
                  'No se pudo preparar el cambio. Revisa el aviso de la conversación.',
                );
            } catch {
              setError('Revisa el nombre, monto y fecha de tu meta.');
            }
          }}
        >
          <fieldset disabled={disabled}>
            {editsFields ? (
              <>
                <label>
                  Nombre de la meta
                  <input
                    name="name"
                    maxLength={80}
                    required
                    defaultValue={editor.draft?.name ?? g?.name ?? ''}
                  />
                </label>
                <label>
                  Monto objetivo (MXN)
                  <input
                    name="target"
                    inputMode="decimal"
                    required
                    defaultValue={
                      (editor.draft?.targetCents ?? g?.targetCents)
                        ? (
                            (editor.draft?.targetCents ?? g?.targetCents ?? 0) /
                            100
                          ).toFixed(2)
                        : ''
                    }
                  />
                </label>
                <label>
                  Fecha objetivo (opcional)
                  <input
                    name="deadline"
                    type="date"
                    min={list.today}
                    max="9999-12-31"
                    defaultValue={
                      editor.draft?.deadline !== undefined
                        ? (editor.draft.deadline ?? '')
                        : (g?.deadline ?? '')
                    }
                  />
                </label>
              </>
            ) : (
              <p>
                <strong>{g?.name}</strong> · {formatMoney(g?.targetCents ?? 0)}
              </p>
            )}
            <div className="chat-goal-actions">
              <Button type="submit" className="button">
                Revisar cambio
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditor(null);
                  setError('');
                }}
              >
                Volver a mis metas
              </Button>
            </div>
          </fieldset>
        </form>
        {error && <p role="alert">{error}</p>}
        <small>Crear o modificar una meta no aparta dinero.</small>
      </section>
    );
  }
  return (
    <section className="chat-financial-list chat-goals" aria-label="Tus metas">
      <div className="chat-goal-heading">
        <h4>
          Tus metas <span>{list.total}</span>
        </h4>
        <Button
          variant="ghost"
          disabled={disabled}
          onClick={() => setEditor({ operation: 'create' })}
        >
          Nueva meta
        </Button>
      </div>
      <fieldset
        className="chat-goal-tabs"
        disabled={disabled}
        aria-label="Estado de las metas"
      >
        {(['active', 'archived'] as const).map((status) => (
          <Button
            key={status}
            variant="ghost"
            aria-pressed={currentStatus === status}
            onClick={() => {
              void onAction('list_goals', { values: { status, page: 1 } });
            }}
          >
            {status === 'active' ? 'Activas' : 'Archivadas'}
          </Button>
        ))}
      </fieldset>
      {list.items.length ? (
        <ul className="chat-goals-grid">
          {list.items.map((g) => (
            <li key={g.id}>
              <GoalCard goal={g} today={list.today ?? ''} />
              <div className="chat-goal-actions">
                <Button
                  variant="ghost"
                  disabled={disabled || g.updatedAt === undefined}
                  onClick={() => setEditor({ operation: 'edit', goal: g })}
                  aria-label={`Editar ${g.name}`}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  disabled={disabled || g.updatedAt === undefined}
                  onClick={() =>
                    setEditor({
                      operation: g.status === 'active' ? 'archive' : 'restore',
                      goal: g,
                    })
                  }
                  aria-label={`${g.status === 'active' ? 'Archivar' : 'Recuperar'} ${g.name}`}
                >
                  {g.status === 'active' ? 'Archivar' : 'Recuperar'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          No tienes metas{' '}
          {currentStatus === 'active' ? 'activas' : 'archivadas'}.
        </p>
      )}
      {list.total > list.pageSize && (
        <div className="chat-goal-actions">
          <Button
            variant="ghost"
            disabled={disabled || list.page <= 1}
            onClick={() => {
              void onAction('list_goals', {
                values: { status: currentStatus, page: list.page - 1 },
              });
            }}
          >
            Anterior
          </Button>
          <span>
            Página {list.page} de {Math.ceil(list.total / list.pageSize)}
          </span>
          <Button
            variant="ghost"
            disabled={disabled || list.page * list.pageSize >= list.total}
            onClick={() => {
              void onAction('list_goals', {
                values: { status: currentStatus, page: list.page + 1 },
              });
            }}
          >
            Siguiente
          </Button>
        </div>
      )}
      <small>Montos objetivo, no dinero apartado.</small>
    </section>
  );
}
export function GoalConfirmation({
  data,
  turn,
  disabled,
  now,
  onAction,
}: {
  data: unknown;
  turn: Turn;
  disabled: boolean;
  now: number;
  onAction: Act;
}) {
  const c = z
    .object({
      actionId: z.uuid(),
      before: goal.nullable(),
      change: z.object({
        operation: z.enum(['create', 'edit', 'archive', 'restore']),
        name: fields.name.optional(),
        targetCents: fields.targetCents.optional(),
        deadline: fields.deadline.optional(),
      }),
    })
    .parse(data);
  const pending = turn.pendingActions.find((p) => p.id === c.actionId);
  const unavailable =
    !pending ||
    !['pending', 'executing'].includes(pending.status) ||
    (pending.status === 'pending' && pending.expiresAt <= now);
  const name = c.change.name ?? c.before?.name;
  const target = c.change.targetCents ?? c.before?.targetCents ?? 0;
  const deadline =
    c.change.deadline !== undefined ? c.change.deadline : c.before?.deadline;
  return (
    <section className="chat-confirm" aria-label="Confirmar cambio de meta">
      <h4>{labels[c.change.operation]}</h4>
      <dl>
        <div>
          <dt>Meta</dt>
          <dd>{name}</dd>
        </div>
        <div>
          <dt>Monto objetivo</dt>
          <dd>{formatMoney(target)}</dd>
        </div>
        <div>
          <dt>Fecha objetivo</dt>
          <dd>{deadline ? formatMovementDate(deadline) : 'Sin fecha'}</dd>
        </div>
        {c.change.operation === 'edit' && c.before && (
          <div>
            <dt>Antes</dt>
            <dd>
              {c.before.name} · {formatMoney(c.before.targetCents)} ·{' '}
              {c.before.deadline
                ? formatMovementDate(c.before.deadline)
                : 'Sin fecha'}
            </dd>
          </div>
        )}
      </dl>
      <p>
        {c.change.operation === 'archive'
          ? 'Se conservará en Archivadas y podrás recuperarla.'
          : 'Este cambio no mueve dinero.'}
      </p>
      {unavailable ? (
        <p>
          {pending?.status === 'completed'
            ? 'Cambio guardado.'
            : pending?.status === 'cancelled'
              ? 'Cambio cancelado.'
              : 'Esta confirmación expiró o ya no está disponible.'}
        </p>
      ) : (
        <div className="chat-goal-actions">
          <Button
            className="button"
            disabled={disabled}
            onClick={() => {
              void onAction('confirm_goal', { actionId: c.actionId });
            }}
          >
            Confirmar cambio
          </Button>
          <Button
            variant="ghost"
            disabled={disabled || pending?.status !== 'pending'}
            onClick={() => {
              void onAction('cancel_goal', { actionId: c.actionId });
            }}
          >
            Cancelar cambio
          </Button>
        </div>
      )}
    </section>
  );
}
