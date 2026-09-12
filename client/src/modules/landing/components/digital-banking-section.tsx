import { ArrowRight, ArrowUpRight, MessageCircle } from 'lucide-react';
const bankingUrl = '/login';
export function DigitalBankingSection() {
  return (
    <section
      className="perspective-digital"
      id="banca"
      aria-labelledby="digital-title"
    >
      <div className="digital-copy">
        <span className="digital-label">Una banca más cercana</span>
        <h2 id="digital-title">
          De tus planes
          <br />a tu próximo paso.
        </h2>
        <p>
          Tus cuentas, tus movimientos y una nueva forma de entender tu dinero.
          Todo empieza con una conversación.
        </p>
        <a className="button" href={bankingUrl}>
          Explora tu banca <ArrowRight size={18} aria-hidden="true" />
        </a>
        <small>Una perspectiva más clara de tu dinero.</small>
      </div>
      <div className="conversation-preview">
        <div className="conversation-heading">
          <MessageCircle size={20} aria-hidden="true" />
          <span>Asistente Banorte</span>
          <span className="conversation-demo">Banorte IA</span>
        </div>
        <p className="conversation-question">¿En qué gasté este mes?</p>
        <div className="conversation-answer">
          <span>Tu mes, más claro.</span>
          <p>Así se distribuyen tus gastos.</p>
          <div className="spend-total">
            $48,350<span>.00</span>
          </div>
          <div
            className="spend-breakdown"
            aria-label="Vivienda 38%, compras 29%, servicios 18%, otros 15%"
          >
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="spend-legend">
            <span>
              Vivienda <b>$18,400</b>
            </span>
            <span>
              Compras <b>$14,200</b>
            </span>
            <span>
              Servicios <b>$8,750</b>
            </span>
            <span>
              Otros <b>$7,000</b>
            </span>
          </div>
        </div>
        <a href={bankingUrl}>
          Haz tu primera pregunta <ArrowUpRight size={17} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
