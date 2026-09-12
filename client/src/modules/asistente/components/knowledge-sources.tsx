'use client';
import { z } from 'zod';
import { API_BASE } from '@/shared/api/client';

const schema = z.object({
  items: z
    .array(
      z.object({
        id: z.uuid(),
        documentId: z.uuid(),
        citation: z.string().regex(/^S\d+$/),
        title: z.string(),
        page: z.number().int().positive(),
        excerpt: z.string(),
        validFrom: z.iso.date().nullable(),
        validTo: z.iso.date().nullable(),
        validity: z.enum(['dated', 'unknown', 'historical', 'future']),
      }),
    )
    .max(30),
  empty: z.string(),
});
const date = (value: string) =>
  new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));

export function KnowledgeSources({ data }: { data: unknown }) {
  const sources = schema.parse(data);
  return (
    <section className="chat-sources" aria-label="Fuentes documentales">
      <div className="chat-sources-heading">
        <span>DOCUMENTACIÓN</span>
        <h4>Fuentes consultadas</h4>
      </div>
      {!sources.items.length && <p>{sources.empty}</p>}
      {sources.items.map((source) => (
        <details key={source.id} className="chat-source">
          <summary>
            <span className="chat-source-marker">{source.citation}</span>
            <span>
              <strong>{source.title}</strong>
              <small>
                Página {source.page} del PDF ·{' '}
                {source.validity === 'unknown'
                  ? 'Vigencia no indicada'
                  : source.validity === 'historical'
                    ? 'Condición vencida'
                    : source.validity === 'future'
                      ? 'Próxima vigencia'
                      : `Hasta ${date(source.validTo!)}`}
              </small>
            </span>
            <span className="chat-source-expand" aria-hidden="true">
              +
            </span>
          </summary>
          <div className="chat-source-body">
            <p
              className={`chat-source-validity ${source.validity !== 'dated' ? 'chat-source-caution' : ''}`}
            >
              {source.validity === 'historical'
                ? `Condición histórica · terminó el ${date(source.validTo!)}`
                : source.validity === 'future'
                  ? `Aún no vigente · inicia el ${date(source.validFrom!)}`
                  : source.validity === 'unknown'
                    ? 'Este documento no indica una vigencia general. Confirma las condiciones actuales.'
                    : `Vigencia${source.validFrom ? ` desde el ${date(source.validFrom)}` : ''} hasta el ${date(source.validTo!)}`}
            </p>
            <blockquote>{source.excerpt}</blockquote>
            <a
              href={`${API_BASE}/knowledge/documents/${source.documentId}/file#page=${source.page}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir PDF · página {source.page} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </details>
      ))}
    </section>
  );
}
