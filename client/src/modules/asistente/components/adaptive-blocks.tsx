'use client';
import { z } from 'zod';
import { formatMoney, formatMovementDate } from '@/shared/utils/money';
import { API_BASE } from '@/shared/api/client';
const cents = z.number().int();
const period = z.object({
  period: z.object({ from: z.iso.date(), to: z.iso.date() }),
  incomeCents: cents,
  expenseCents: cents,
  netCents: cents,
  movementCount: z.number().int(),
});

export function PeriodComparison({ data }: { data: unknown }) {
  const d = z
    .object({
      first: period,
      second: period,
      deltaCents: cents,
      changePercent: z.number().nullable(),
      differentDurations: z.boolean(),
    })
    .parse(data);
  const max = Math.max(d.first.expenseCents, d.second.expenseCents, 1);
  return (
    <section className="chat-comparison" aria-label="Comparación de gastos">
      <h4>Cómo cambiaron tus gastos</h4>
      <div className="chat-comparison-periods">
        {[d.first, d.second].map((p, index) => (
          <div key={index}>
            <span>
              {formatMovementDate(p.period.from)} —{' '}
              {formatMovementDate(p.period.to)}
            </span>
            <strong>{formatMoney(p.expenseCents)}</strong>
            <div className="chat-comparison-track" aria-hidden="true">
              <i style={{ width: `${(p.expenseCents / max) * 100}%` }} />
            </div>
            <small>{p.movementCount} movimientos en el periodo</small>
          </div>
        ))}
      </div>
      <p>
        <strong>
          {formatMoney(Math.abs(d.deltaCents))}{' '}
          {d.deltaCents > 0
            ? 'más'
            : d.deltaCents < 0
              ? 'menos'
              : 'de diferencia'}
        </strong>{' '}
        en el segundo periodo.
        {d.changePercent !== null
          ? ` Cambio: ${d.changePercent > 0 ? '+' : ''}${d.changePercent}%.`
          : ' Sin porcentaje comparable: el primer periodo no tuvo gastos.'}
      </p>
      {d.differentDurations && (
        <small>
          Los periodos tienen distinta duración. Se comparan totales, no
          promedios diarios.
        </small>
      )}
      <details>
        <summary>Ver ingresos y resultado de cada periodo</summary>
        <div className="chat-table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Periodo</th>
                <th scope="col">Ingresos</th>
                <th scope="col">Gastos</th>
                <th scope="col">Neto</th>
              </tr>
            </thead>
            <tbody>
              {[d.first, d.second].map((p, index) => (
                <tr key={index}>
                  <th scope="row">
                    {formatMovementDate(p.period.from)} —{' '}
                    {formatMovementDate(p.period.to)}
                  </th>
                  <td>{formatMoney(p.incomeCents)}</td>
                  <td>{formatMoney(p.expenseCents)}</td>
                  <td>{formatMoney(p.netCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <small>
          El neto del periodo no es el saldo disponible de tu cuenta.
        </small>
      </details>
    </section>
  );
}

export function KnowledgeFacts({ data }: { data: unknown }) {
  const { items } = z
    .object({
      items: z
        .array(
          z.object({
            id: z.uuid(),
            documentId: z.uuid(),
            quote: z.string().max(1700),
            title: z.string(),
            citation: z.string().regex(/^S\d+$/),
            product: z.enum(['clasica', 'oro', 'platinum']),
            page: z.number().int().positive(),
            validity: z.enum(['dated', 'unknown', 'historical', 'future']),
            validTo: z.iso.date().nullable(),
          }),
        )
        .max(5),
    })
    .parse(data);
  return (
    <section
      className="chat-knowledge-facts"
      aria-label="Información documentada"
    >
      <h4>Lo que dicen los documentos</h4>
      <p>
        Extractos originales. Abre la fuente para revisar todas sus condiciones.
      </p>
      <div className="chat-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Información documentada</th>
              <th scope="col">Tarjeta y vigencia</th>
              <th scope="col">Fuente</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s, index) => (
              <tr key={`${s.id}:${index}`}>
                <td>{s.quote}</td>
                <td>
                  <strong>
                    {s.product === 'clasica'
                      ? 'Clásica'
                      : s.product === 'oro'
                        ? 'Oro'
                        : 'Platinum'}
                  </strong>
                  <small>
                    {s.validity === 'unknown'
                      ? 'Vigencia no indicada'
                      : s.validity === 'historical'
                        ? 'Condición vencida'
                        : s.validity === 'future'
                          ? 'Aún no vigente'
                          : `Hasta ${formatMovementDate(s.validTo!)}`}
                  </small>
                </td>
                <td>
                  <a
                    href={`${API_BASE}/knowledge/documents/${s.documentId}/file#page=${s.page}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.citation}: ${s.title}, página ${s.page}`}
                  >
                    {s.citation} ↗
                  </a>
                  <small>Pág. {s.page}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const traceItem = z.object({
  id: z.string(),
  date: z.iso.date(),
  description: z.string(),
  type: z.enum(['income', 'expense']),
  category: z.string(),
  amountCents: cents,
  runningBalanceCents: cents,
  card: z
    .object({ last4: z.string(), product: z.object({ name: z.string() }) })
    .nullable()
    .optional(),
});

export function BalanceTrace({ data }: { data: unknown }) {
  const d = z
    .object({
      period: z.object({ from: z.iso.date(), to: z.iso.date() }),
      openingBalanceCents: cents,
      closingBalanceCents: cents,
      total: z.number().int(),
      truncated: z.boolean(),
      items: z.array(traceItem),
    })
    .parse(data);
  return (
    <section className="chat-trace" aria-label="Trazabilidad de saldo">
      <h4>Cómo llegaste a tu saldo</h4>
      <p>
        Saldo inicial el {formatMovementDate(d.period.from)}:{' '}
        <strong>{formatMoney(d.openingBalanceCents)}</strong>
      </p>
      <ol className="chat-trace-list">
        {d.items.map((m) => (
          <li key={m.id}>
            <div>
              <span>{m.description}</span>
              <small>
                {formatMovementDate(m.date)} · {m.category}
                {m.card ? ` · ${m.card.product.name} ${m.card.last4}` : ''}
              </small>
            </div>
            <div>
              <b>
                {m.type === 'income' ? '+' : '−'}
                {formatMoney(m.amountCents)}
              </b>
              <small>Saldo: {formatMoney(m.runningBalanceCents)}</small>
            </div>
          </li>
        ))}
      </ol>
      {!d.items.length && <p>No hay movimientos en este periodo.</p>}
      <p>
        Saldo al {formatMovementDate(d.period.to)}:{' '}
        <strong>{formatMoney(d.closingBalanceCents)}</strong>
      </p>
      {d.truncated && (
        <small>
          Mostrando los primeros {d.items.length} de {d.total} movimientos del
          periodo. Acota el rango de fechas para ver el resto.
        </small>
      )}
    </section>
  );
}
