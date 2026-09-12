'use client';
import { useState } from 'react';
import { z } from 'zod';
import { Flag, CreditCard } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { formText } from '@/shared/api/client';
import { formatMoney, formatMovementDate } from '@/shared/utils/money';
import { CardArtwork } from '@/modules/tarjetas/components/card-artwork';

const cents = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export function CardList({ data }: { data: unknown }) {
  const { items } = z
    .object({
      items: z.array(
        z.object({
          id: z.string(),
          last4: z.string().regex(/^\d{4}$/),
          status: z.string(),
          isPreferred: z.boolean(),
          product: z.object({
            key: z.enum(['clasica', 'oro', 'platinum', 'infinite']).transform(key => key === 'infinite' ? 'platinum' as const : key),
            name: z.string(),
            network: z.string(),
          }),
        }),
      ),
    })
    .parse(data);
  return (
    <section className="chat-financial-list" aria-label="Tus tarjetas">
      <h4>
        Tus tarjetas <span>{items.length}</span>
      </h4>
      {items.length ? (
        <ul>
          {items.map((c) => (
            <li key={c.id}>
              <CardArtwork cardId={c.product.key} className="chat-card-art" />
              <div>
                <strong>{c.product.name}</strong>
                <small>
                  {c.product.network} · •••• {c.last4}
                </small>
              </div>
              <div className="chat-item-meta">
                <span>{c.status === 'active' ? 'Activa' : 'Inactiva'}</span>
                {c.isPreferred && <small>Principal</small>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="chat-empty">
          <CreditCard size={20} /> Aún no tienes tarjetas asignadas.
        </p>
      )}
    </section>
  );
}
export function GoalList({ data }: { data: unknown }) {
  const { items, total } = z
    .object({
      total: z.number().int(),
      items: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          targetCents: cents,
          deadline: z.string().nullable(),
          status: z.enum(['active', 'archived']),
        }),
      ),
    })
    .parse(data);
  return (
    <section className="chat-financial-list" aria-label="Tus metas">
      <h4>
        Tus metas <span>{total}</span>
      </h4>
      {items.length ? (
        <ul>
          {items.map((g) => (
            <li key={g.id}>
              <Flag size={20} aria-hidden="true" />
              <div>
                <strong>{g.name}</strong>
                <small>
                  {g.deadline
                    ? `Para el ${formatMovementDate(g.deadline)}`
                    : 'Sin fecha objetivo'}
                  {g.status === 'archived' ? ' · Archivada' : ''}
                </small>
              </div>
              <strong className="chat-item-meta">
                {formatMoney(g.targetCents)}
              </strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="chat-empty">
          <Flag size={20} /> No hay metas en esta consulta.
        </p>
      )}
      {items.length > 0 && (
        <small>
          Montos objetivo. Crear una meta no aparta dinero.
          {total > items.length
            ? ` Mostrando ${items.length} de ${total}.`
            : ''}
        </small>
      )}
    </section>
  );
}
const assumptions = z.object({
  initialCents: cents,
  monthlyContributionCents: cents,
  months: z.number().int().min(1).max(600),
  annualRateBps: z.number().int().min(0).max(10000),
});
const resultSchema = z.object({
  assumptions,
  finalCents: cents,
  totalContributedCents: cents,
  estimatedInterestCents: cents,
  schedule: z
    .array(
      z.object({
        month: z.number().int(),
        contributedCents: cents,
        interestCents: cents,
        balanceCents: cents,
      }),
    )
    .max(600),
});
export function SavingsBlock({
  data,
  disabled,
  onSubmit,
}: {
  data: unknown;
  disabled: boolean;
  onSubmit: (values: z.infer<typeof assumptions>) => Promise<boolean>;
}) {
  const { result } = z.object({ result: resultSchema.nullable() }).parse(data);
  const [error, setError] = useState('');
  return (
    <section className="chat-savings" aria-label="Simulador de ahorro">
      <h4>Explora tu ahorro</h4>
      <p>Define un escenario con tus propios importes y tasa.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          const d = new FormData(e.currentTarget);
          try {
            const toCents = (name: string) => {
              const raw = formText(d, name);
              if (!/^\d+(\.\d{1,2})?$/.test(raw))
                throw new Error(
                  'Usa importes positivos con máximo dos decimales.',
                );
              return Math.round(Number(raw) * 100);
            };
            const values = assumptions.parse({
              initialCents: toCents('initial'),
              monthlyContributionCents: toCents('monthly'),
              months: Number(formText(d, 'months')),
              annualRateBps: toCents('rate'),
            });
            if (!(await onSubmit(values)))
              setError(
                'No se pudo calcular. Revisa el aviso de la conversación.',
              );
          } catch {
            setError('Revisa los importes, el plazo y la tasa del escenario.');
          }
        }}
      >
        <fieldset disabled={disabled}>
          <label>
            Ahorro inicial (MXN)
            <input
              name="initial"
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              inputMode="decimal"
              defaultValue={result ? result.assumptions.initialCents / 100 : ''}
              required
            />
          </label>
          <label>
            Aportación mensual (MXN)
            <input
              name="monthly"
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              inputMode="decimal"
              defaultValue={
                result ? result.assumptions.monthlyContributionCents / 100 : ''
              }
              required
            />
          </label>
          <label>
            Plazo en meses
            <input
              name="months"
              type="number"
              min="1"
              max="600"
              defaultValue={result?.assumptions.months ?? ''}
              required
            />
          </label>
          <label>
            Tasa anual del escenario (%)
            <input
              name="rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              inputMode="decimal"
              defaultValue={
                result ? result.assumptions.annualRateBps / 100 : ''
              }
              required
            />
          </label>
          <Button type="submit" className="button">
            Calcular escenario
          </Button>
        </fieldset>
      </form>
      {error && <p role="alert">{error}</p>}
      {result && (
        <div className="chat-savings-result">
          <span>Saldo proyectado a {result.assumptions.months} meses</span>
          <strong>
            {formatMoney(result.finalCents)} <small>MXN</small>
          </strong>
          <dl>
            <div>
              <dt>Tus aportaciones</dt>
              <dd>{formatMoney(result.totalContributedCents)}</dd>
            </div>
            <div>
              <dt>Interés estimado</dt>
              <dd>{formatMoney(result.estimatedInterestCents)}</dd>
            </div>
          </dl>
          <details>
            <summary>Ver proyección mensual</summary>
            <div className="chat-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th>Aportación</th>
                    <th>Interés</th>
                    <th>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.map((r) => (
                    <tr key={r.month}>
                      <td>{r.month}</td>
                      <td>{formatMoney(r.contributedCents)}</td>
                      <td>{formatMoney(r.interestCents)}</td>
                      <td>{formatMoney(r.balanceCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
      <small>
        Tasa nominal anual fija y aportaciones al final del mes, con redondeo
        mensual. Excluye impuestos, comisiones e inflación. Es una proyección,
        sin rendimiento garantizado; no mueve dinero.
      </small>
    </section>
  );
}
