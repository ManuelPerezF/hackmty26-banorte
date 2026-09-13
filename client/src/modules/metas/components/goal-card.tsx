import { Flag } from 'lucide-react';
import { formatMoney, formatMovementDate } from '@/shared/utils/money';
import { goalPlan } from '../services/goal-plan';
import '../styles/goal-card.css';

export type GoalCardGoal = {
  name: string;
  targetCents: number;
  deadline: string | null;
  status: string;
};

/**
 * Una meta con forma de tarjeta. Muestra objetivo, fecha y la referencia
 * mensual que ya calcula `goalPlan`; nunca un avance ni un saldo, porque la
 * meta no aparta dinero y el modelo no guarda cuánto se lleva ahorrado.
 */
export function GoalCard({
  goal,
  today,
  foot = 'monthly',
}: {
  goal: GoalCardGoal;
  today: string;
  /** Qué acompaña al monto en el pie. En el detalle es 'none': ahí el aside ya
   *  lleva la referencia mensual y la ficha de al lado la fecha, así que
   *  repetir cualquiera de las dos en la tarjeta sería ruido. */
  foot?: 'monthly' | 'date' | 'none';
}) {
  const archived = goal.status === 'archived';
  const plan = archived
    ? null
    : goalPlan(goal.targetCents, goal.deadline, today);
  const chip = archived
    ? 'Archivada'
    : !plan
      ? 'Sin fecha'
      : plan.status === 'overdue'
        ? 'Revisar fecha'
        : plan.status === 'today'
          ? 'Fecha de hoy'
          : `${plan.months} ${plan.months === 1 ? 'mes' : 'meses'}`;
  return (
    <article className={`goal-card ${archived ? 'is-archived' : ''}`}>
      <div className="goal-card-top">
        <Flag size={17} strokeWidth={1.8} />
        <span className="goal-card-label">Meta de ahorro</span>
        <span className="goal-card-chip">{chip}</span>
      </div>
      <h3 className="goal-card-name">{goal.name}</h3>
      <div className="goal-card-foot">
        <div>
          <span className="goal-card-label">Monto objetivo</span>
          <span className="goal-card-amount">
            {formatMoney(goal.targetCents)}
          </span>
        </div>
        {foot !== 'none' && (
          <div>
            <span className="goal-card-label">
              {foot === 'monthly' && plan?.status === 'scheduled'
                ? 'Referencia mensual'
                : 'Fecha'}
            </span>
            <span className="goal-card-monthly">
              {foot === 'monthly' &&
              plan?.status === 'scheduled' &&
              plan.monthlyCents !== null
                ? `${formatMoney(plan.monthlyCents)} al mes`
                : goal.deadline
                  ? formatMovementDate(goal.deadline)
                  : 'Sin definir'}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
