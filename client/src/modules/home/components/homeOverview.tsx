'use client';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Command,
  Plus,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

import { CardArtwork } from '@/modules/tarjetas/components/card-artwork';

import type { HomeProps, DemoTransaction } from '../types/home.types';
export function HomeOverview({
  onNavigate,
  cardId,
  transactions,
}: HomeProps & { transactions: readonly DemoTransaction[] }) {
  return (
    <div className="finance-workspace account-home">
      {' '}
      <nav className="account-tabs" aria-label="Vistas de inicio">
        <Button variant="ghost" aria-current="page">
          Cuentas
        </Button>
        <Button variant="ghost" onClick={() => onNavigate('Tarjetas')}>
          Tarjetas
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            onNavigate('Chat');
          }}
        >
          Análisis
        </Button>
      </nav>
      <div className="panel-with-chat">
        <div className="panel-account-column">
          <section
            className="modern-balance"
            aria-label="Saldo de demostración"
          >
            <div className="modern-balance-label">
              Saldo total{' '}
              <span>
                MXN <ChevronDown size={14} />
              </span>
            </div>
            <div className="modern-balance-amount">
              $284,650<span>.00</span>
            </div>
            <div className="modern-balance-actions">
              <Button onClick={() => onNavigate('Transferencias')}>
                <ArrowUpRight size={19} /> Enviar dinero
              </Button>
              <Button variant="ghost" onClick={() => onNavigate('Cuentas')}>
                <Plus size={19} /> Ver cuentas
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  onNavigate('Chat');
                }}
              >
                <TrendingUp size={19} /> Analizar
              </Button>
            </div>
          </section>
          <div className="modern-account-grid">
            <section
              className="everyday-account"
              aria-labelledby="everyday-title"
            >
              <div className="wallet-art">
                <div className="wallet-back">
                  <span>ALEX MORGAN</span>
                </div>
                <CardArtwork cardId={cardId} className="wallet-bank-card" />
                <div className="wallet-front">
                  <span>
                    <CreditCard size={16} /> 1 tarjeta
                  </span>
                  <span>BANORTE</span>
                </div>
              </div>
              <div className="everyday-content">
                <div className="everyday-heading">
                  <h2 id="everyday-title">Tu cuenta personal</h2>
                  <Button
                    variant="ghost"
                    aria-label="Ver tu cuenta personal"
                    onClick={() => onNavigate('Cuentas')}
                  >
                    <ChevronRight size={21} />
                  </Button>
                </div>
                <p>Todo listo para tu próximo paso.</p>
                <div className="account-currency-row">
                  <span className="peso-symbol">$</span>
                  <div>
                    <strong>Peso mexicano</strong>
                    <span>MXN · •••• 4281</span>
                  </div>
                  <strong>$284,650.00</strong>
                </div>
                <Button
                  variant="ghost"
                  className="account-details"
                  onClick={() => onNavigate('Tarjetas')}
                >
                  <CreditCard size={16} /> Ver mi tarjeta{' '}
                  <ArrowUpRight size={15} />
                </Button>
              </div>
            </section>
            <section
              className="intelligence-card"
              aria-labelledby="intelligence-title"
            >
              <div className="intelligence-topline">
                <span>
                  <Command size={18} /> Banorte IA
                </span>
                <span className="concept-pill">Nuevo concepto</span>
              </div>
              <h2 id="intelligence-title">
                Tu dinero habla.
                <br />
                Ahora puedes responderle.
              </h2>
              <p>
                Pregunta, entiende y descubre una nueva perspectiva de tu
                dinero.
              </p>
              <div className="intelligence-bottom">
                <Button
                  className="open-assistant"
                  onClick={() => onNavigate('Chat')}
                >
                  Conoce tu asistente <ArrowRight size={17} />
                </Button>
                <div className="insight-mini" aria-hidden="true">
                  <span>Tu flujo este mes</span>
                  <strong>+$38,050</strong>
                  <div>
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              </div>
            </section>
          </div>
          <section
            className="modern-transactions"
            aria-labelledby="recent-title"
          >
            <div className="finance-section-title">
              <h3 id="recent-title">Movimientos</h3>
              <Button variant="ghost" onClick={() => onNavigate('Gastos')}>
                Ver todos <ArrowUpRight size={16} />
              </Button>
            </div>
            <span className="transaction-day">Septiembre</span>
            <div className="transaction-list">
              {transactions.map((t) => (
                <div className="transaction-row" key={t.name}>
                  <span
                    className={`merchant-avatar ${t.incoming ? 'incoming' : ''}`}
                  >
                    {t.initials}
                  </span>
                  <div className="merchant-copy">
                    <strong>{t.name}</strong>
                    <span>{t.category}</span>
                  </div>
                  <div className="transaction-value">
                    <strong className={t.incoming ? 'incoming' : ''}>
                      {t.amount}
                    </strong>
                    <span>{t.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
