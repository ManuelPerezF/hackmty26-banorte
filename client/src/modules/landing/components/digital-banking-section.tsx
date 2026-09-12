import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  ChartColumn,
  Receipt,
} from 'lucide-react';
import { MayaMark } from '@/modules/asistente/components/maya-mark';
const bankingUrl = '/login';
export function DigitalBankingSection() {
  return (
    <section
      className="perspective-digital"
      id="banca"
      aria-labelledby="digital-title"
    >
      <div className="digital-copy">
        <span className="digital-label">Conoce a Maya</span>
        <h2 id="digital-title">
          De tus planes
          <br />a tu próximo paso.
        </h2>
        <p>
          Pregunta por tus gastos, registra movimientos y consulta los
          documentos de tus tarjetas. Maya adapta la información a lo que
          necesitas.
        </p>
        <a className="button" href={bankingUrl}>
          Habla con Maya <ArrowRight size={18} aria-hidden="true" />
        </a>
        <small>Inicia sesión para conversar sobre tu dinero.</small>
      </div>
      <div className="conversation-preview" aria-label="Conoce el chat de Maya">
        <div className="conversation-heading">
          <MayaMark />
          <div>
            <strong>Maya</strong>
            <span>Asistente Banorte</span>
          </div>
        </div>
        <div className="maya-preview-welcome">
          <MayaMark />
          <h3>
            Hagamos espacio
            <br />
            para tus planes.
          </h3>
          <p>Tu siguiente paso empieza con una pregunta.</p>
        </div>
        <a
          className="maya-preview-compose"
          href={bankingUrl}
          aria-label="Inicia sesión para hacerle una pregunta a Maya"
        >
          <span>Pregunta algo sobre tus cuentas o tus planes…</span>
          <span className="maya-preview-send">
            <ArrowUp size={18} aria-hidden="true" />
          </span>
        </a>
        <div className="maya-preview-suggestions">
          <p>Podemos empezar por aquí</p>
          {[
            { icon: ChartColumn, label: '¿En qué gasté este mes?' },
            { icon: Receipt, label: 'Quiero registrar un movimiento' },
            {
              icon: BookOpen,
              label: 'Consultar documentos',
              detail: 'Elige tu tarjeta, un tema y tu pregunta.',
            },
          ].map(({ icon: Icon, label, detail }) => (
            <a key={label} href={bankingUrl}>
              <Icon size={17} strokeWidth={1.5} aria-hidden="true" />
              <span>
                {label}
                {detail && <small>{detail}</small>}
              </span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
