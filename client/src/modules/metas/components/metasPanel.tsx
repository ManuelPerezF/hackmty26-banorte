'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Archive,
  CalendarDays,
  Flag,
  Plus,
  RotateCcw,
  Pencil,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { formatMoney, formatMovementDate } from '@/shared/utils/money';
import { useBank } from '@/modules/cuentas/context/bank-context';
import { SavingsSimulator } from '@/modules/simulaciones/components/savings-simulator';
import type { Goal } from '@/shared/api/types';
import type { useMetas } from '../hooks/useMetas';
import { goalPlan } from '../services/goal-plan';
import { GoalCard } from './goal-card';
import { GoalForm } from './goal-form';
import '../styles/metas.css';
const ideas = [
  'Fondo de emergencia',
  'Mi próximo viaje',
  'Un proyecto personal',
];
function status(goal: Goal, today: string) {
  if (goal.status === 'archived') return 'Archivada';
  const plan = goalPlan(goal.targetCents, goal.deadline, today);
  return !plan
    ? 'Sin fecha'
    : plan.status === 'overdue'
      ? 'Revisar fecha'
      : plan.status === 'today'
        ? 'Fecha objetivo: hoy'
        : 'Con fecha';
}
export function MetasPanel(props: ReturnType<typeof useMetas>) {
  const {
    goals,
    archivedGoals,
    addGoal,
    editGoal,
    archive,
    restore,
    busy,
    loading,
    error,
    notice,
  } = props;
  const { profile } = useBank();
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: profile.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [selected, setSelected] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ goal?: Goal; name?: string } | null>(
    null,
  );
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (selected || editor) heading.current?.focus();
  }, [selected, editor]);
  const goal = [...goals, ...archivedGoals].find((g) => g.id === selected);
  const visible = tab === 'active' ? goals : archivedGoals;
  const plan = goal ? goalPlan(goal.targetCents, goal.deadline, today) : null;
  const back = () => {
    setSelected(null);
    setEditor(null);
  };
  if (!props.loaded)
    return (
      <section className="goals-view" aria-label="Tus metas">
        {loading ? (
          <output>Cargando tus metas…</output>
        ) : (
          <>
            <p className="goal-error" role="alert">
              {error}
            </p>
            <Button onClick={props.retry}>Volver a intentar</Button>
          </>
        )}
      </section>
    );
  return (
    <section
      className="goals-view"
      aria-labelledby="goals-title"
      aria-busy={loading || busy}
    >
      {(editor || goal) && (
        <Button
          className="goals-back"
          variant="ghost"
          disabled={busy}
          onClick={back}
        >
          <ArrowLeft size={17} /> Todas mis metas
        </Button>
      )}
      <header className="goals-intro">
        <div>
          <h2 id="goals-title" tabIndex={-1} ref={heading}>
            {editor
              ? editor.goal
                ? 'Ajusta tu meta.'
                : '¿Qué quieres hacer realidad?'
              : goal
                ? goal.name
                : 'Tus planes empiezan aquí.'}
          </h2>
          <p>
            {editor
              ? 'Define el monto y, si ya la tienes, una fecha para alcanzarlo.'
              : goal
                ? 'Tu objetivo, tu fecha y una referencia para organizarte.'
                : 'Ponle nombre, monto y fecha a lo que quieres lograr.'}
          </p>
        </div>
        {!editor && !goal && (
          <Button
            className="button"
            disabled={loading || busy}
            onClick={() => setEditor({})}
          >
            <Plus size={17} /> Nueva meta
          </Button>
        )}
      </header>
      {error && (
        <p className="goal-error" role="alert">
          {error}
        </p>
      )}
      <output className="goal-notice" aria-live="polite">
        {notice}
      </output>
      {editor ? (
        <GoalForm
          key={editor.goal?.id ?? editor.name ?? 'new'}
          initial={editor.goal}
          name={editor.name}
          today={today}
          busy={busy}
          onCancel={() => setEditor(null)}
          onSave={async (input) => {
            const saved = editor.goal
              ? await editGoal(editor.goal.id, {
                  name: input.name,
                  targetCents: Math.round(input.target * 100),
                  deadline: input.deadline ?? null,
                })
              : await addGoal(input);
            if (saved) {
              setEditor(null);
              if (!editor.goal) {
                setTab('active');
                setSelected(null);
              }
            }
            return saved;
          }}
        />
      ) : goal ? (
        <div className="goal-detail-layout">
          <div>
            <div className="goal-detail-top">
              <div className="goal-detail-hero">
                <GoalCard goal={goal} today={today} foot="none" />
              </div>
              <dl className="goal-facts">
              <div>
                <dt>
                  <CalendarDays size={17} /> Fecha objetivo
                </dt>
                <dd>
                  {goal.deadline
                    ? formatMovementDate(goal.deadline)
                    : 'Todavía no definida'}
                </dd>
              </div>
                <div>
                  <dt>Tipo de meta</dt>
                  <dd>Plan de ahorro</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>{status(goal, today)}</dd>
                </div>
              </dl>
            </div>
            <div className="goal-actions">
              {goal.status === 'active' ? (
                <>
                  <Button
                    className="button"
                    disabled={busy}
                    onClick={() => setEditor({ goal })}
                  >
                    <Pencil size={16} /> Editar meta
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={async () => {
                      if (await archive(goal.id)) {
                        back();
                        setTab('archived');
                      }
                    }}
                  >
                    <Archive size={16} /> Archivar
                  </Button>
                </>
              ) : (
                <Button
                  className="button"
                  disabled={busy}
                  onClick={async () => {
                    if (await restore(goal.id)) setTab('active');
                  }}
                >
                  <RotateCcw size={16} /> Recuperar meta
                </Button>
              )}
            </div>
          </div>
          <aside
            className="goal-next-step"
            aria-label="Siguiente paso de tu meta"
          >
            <span className="goal-kicker">Tu siguiente paso</span>
            {goal.status === 'archived' ? (
              <>
                <h3>Tu plan está en pausa.</h3>
                <p>
                  Recupera esta meta cuando quieras volver a planificarla. Su
                  nombre, monto y fecha se conservan.
                </p>
              </>
            ) : !plan ? (
              <>
                <h3>Elige una fecha.</h3>
                <p>
                  Así podrás ver una referencia mensual para reunir tu monto
                  objetivo.
                </p>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setEditor({ goal })}
                >
                  Definir fecha <ArrowUpRight size={16} />
                </Button>
              </>
            ) : plan.status !== 'scheduled' ? (
              <>
                <h3>
                  {plan.status === 'today'
                    ? 'Llegó la fecha de tu plan.'
                    : 'Es momento de revisar tu fecha.'}
                </h3>
                <p>
                  Actualiza el plazo para volver a calcular tu referencia
                  mensual. La fecha por sí sola no indica que hayas completado
                  la meta.
                </p>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setEditor({ goal })}
                >
                  Ajustar fecha <ArrowUpRight size={16} />
                </Button>
              </>
            ) : (
              <>
                <h3>Prueba tu plan</h3>
                <p>
                  Arranca en {formatMoney(plan.monthlyCents!)} al mes durante{' '}
                  {plan.months} {plan.months === 1 ? 'mes' : 'meses'}, la
                  referencia para reunir {formatMoney(goal.targetCents)}. Cambia
                  lo que quieras y compara contra tu objetivo.
                </p>
                <SavingsSimulator
                  embedded
                  key={`${goal.id}-${goal.targetCents}-${goal.deadline}`}
                  targetCents={goal.targetCents}
                  initialValues={
                    plan.months <= 600
                      ? {
                          monthlyCents: plan.monthlyCents!,
                          months: plan.months,
                        }
                      : undefined
                  }
                />
              </>
            )}
            <p className="goal-planning-note">
              Esta meta guarda tu plan. No aparta dinero ni mide un saldo
              ahorrado.
            </p>
          </aside>
        </div>
      ) : (
        <>
          <div className="goals-overview">
            <span>
              {goals.length}{' '}
              {goals.length === 1 ? 'meta activa' : 'metas activas'}
            </span>
            <p>
              Suma de objetivos{' '}
              <strong>
                {formatMoney(
                  goals.reduce((total, g) => total + g.targetCents, 0),
                )}
              </strong>
            </p>
            <small>Importe que quieres reunir, no saldo disponible.</small>
          </div>
          <div className="goals-workspace">
            <div>
              <fieldset className="goals-tabs" aria-label="Estado de las metas">
                <button
                  type="button"
                  aria-pressed={tab === 'active'}
                  onClick={() => setTab('active')}
                >
                  Activas <span>{goals.length}</span>
                </button>
                <button
                  type="button"
                  aria-pressed={tab === 'archived'}
                  onClick={() => setTab('archived')}
                >
                  Archivadas <span>{archivedGoals.length}</span>
                </button>
              </fieldset>
              {loading ? (
                <output className="goals-empty">Cargando tus metas…</output>
              ) : visible.length ? (
                <ul className="goals-grid">
                  {visible.map((g) => (
                    <li key={g.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(g.id)}
                        aria-label={`Ver meta ${g.name}`}
                      >
                        <GoalCard goal={g} today={today} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="goals-empty">
                  <Flag size={32} strokeWidth={1.4} />
                  <h3>
                    {tab === 'active'
                      ? '¿Qué te gustaría lograr?'
                      : 'Tus metas archivadas aparecerán aquí.'}
                  </h3>
                  <p>
                    {tab === 'active'
                      ? 'Crea una meta con tu propio monto. Puedes añadir una fecha ahora o después.'
                      : 'Archivar conserva tu plan para que puedas recuperarlo cuando quieras.'}
                  </p>
                  {tab === 'active' && (
                    <Button
                      className="button"
                      disabled={busy}
                      onClick={() => setEditor({})}
                    >
                      Crear mi primera meta <Plus size={16} />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <aside className="goal-ideas" aria-labelledby="goal-ideas-title">
              <h3 id="goal-ideas-title">Ideas para una nueva meta</h3>
              <p>Empieza con un nombre. El monto y la fecha los eliges tú.</p>
              <ul>
                {ideas.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      aria-label={`Crear meta: ${name}`}
                      disabled={loading || busy}
                      onClick={() => setEditor({ name })}
                    >
                      <span>{name}</span>
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
