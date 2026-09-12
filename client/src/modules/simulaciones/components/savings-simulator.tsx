'use client';
import { useState, useRef } from 'react';
import { api, formText } from '@/shared/api/client';
import { parseAmountCents } from '@/modules/movimientos/services/movimientos.service';
import { Button } from '@/shared/components/ui/button';
import { formatMoney } from '@/shared/utils/money';
type Result = {
  finalCents: number;
  totalContributedCents: number;
  estimatedInterestCents: number;
  schedule: {
    month: number;
    contributedCents: number;
    interestCents: number;
    balanceCents: number;
  }[];
};
export function SavingsSimulator() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  return (
    <section className="savings-simulator">
      <h3>Explora cómo podría crecer tu ahorro</h3>
      <p>Elige tus aportaciones y una tasa para comparar un escenario.</p>
      <form
        className="simulation-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (lock.current) return;
          lock.current = true;
          setBusy(true);
          setError('');
          setResult(null);
          const data = new FormData(e.currentTarget);
          try {
            const money = (name: string) =>
              /^0([.,]00?)?$/.test(formText(data, name))
                ? 0
                : parseAmountCents(formText(data, name));
            const body = {
              initialCents: money('initial'),
              monthlyContributionCents: money('monthly'),
              months: Number(formText(data, 'months')),
              annualRateBps: Math.round(Number(formText(data, 'rate')) * 100),
            };
            setResult(
              await api<Result>('/simulations/savings', {
                method: 'POST',
                body,
              }),
            );
          } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo calcular.');
          } finally {
            setBusy(false);
            lock.current = false;
          }
        }}
      >
        <label>
          Ahorro inicial (MXN)
          <input name="initial" inputMode="decimal" defaultValue="0" required />
        </label>
        <label>
          Aportación mensual (MXN)
          <input name="monthly" inputMode="decimal" defaultValue="0" required />
        </label>
        <label>
          Plazo en meses
          <input
            name="months"
            type="number"
            min="1"
            max="600"
            defaultValue="12"
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
            defaultValue="0"
            required
          />
        </label>
        <Button type="submit" className="button" disabled={busy}>
          {busy ? 'Calculando…' : 'Calcular escenario'}
        </Button>
      </form>
      {error && (
        <p role="alert" className="movement-error">
          {error}
        </p>
      )}
      {result && (
        <div className="simulation-result">
          <dl>
            <div>
              <dt>Aportaciones</dt>
              <dd>{formatMoney(result.totalContributedCents)}</dd>
            </div>
            <div>
              <dt>Interés estimado</dt>
              <dd>{formatMoney(result.estimatedInterestCents)}</dd>
            </div>
            <div>
              <dt>Saldo proyectado</dt>
              <dd>{formatMoney(result.finalCents)}</dd>
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
                  {result.schedule.map((row) => (
                    <tr key={row.month}>
                      <td>{row.month}</td>
                      <td>{formatMoney(row.contributedCents)}</td>
                      <td>{formatMoney(row.interestCents)}</td>
                      <td>{formatMoney(row.balanceCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <p>
            Escenario con tasa fija, aportaciones al final del mes y redondeo
            mensual. No incluye impuestos, comisiones ni inflación. El
            rendimiento no está garantizado.
          </p>
        </div>
      )}
    </section>
  );
}
