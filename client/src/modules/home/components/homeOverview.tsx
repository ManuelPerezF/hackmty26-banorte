'use client';
import { useBank } from '@/modules/cuentas/context/bank-context';
import { movementLabel } from '@/modules/movimientos/services/movement-label';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Command,
  Plus,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import { formatMoney, formatMovementDate } from '@/shared/utils/money';
import { Button } from '@/shared/components/ui/button';

import { CardArtwork } from '@/modules/tarjetas/components/card-artwork';

import type { HomeProps } from '../types/home.types';
export function HomeOverview({ onNavigate, cardId, ledger }: HomeProps) {
  const bank = useBank();
  return (
    <div className="finance-workspace account-home">
      {' '}
      <nav className="account-tabs" aria-label="Vistas de inicio">
        <Button variant="ghost" aria-current="page">
          Cuentas
        </Button>
        <Button
          variant="ghost"
          onClick={() => onNavigate('Cuentas')}
        >
          Tarjetas
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            onNavigate('Asistente');
          }}
        >
          Asistente
        </Button>
      </nav>
      <div className="panel-with-chat">
        <div className="panel-account-column">
          <section className="modern-balance" aria-label="Saldo disponible">
            <div className="modern-balance-label">
              Saldo total <span>MXN</span>
            </div>
            <div className="modern-balance-amount">
              {formatMoney(ledger.balanceCents)}
            </div>
            <div className="modern-balance-actions">
              <Button onClick={() => onNavigate('Movimientos')}>
                <Plus size={19} /> Movimientos
              </Button>
              <Button
                variant="ghost"
                onClick={() => onNavigate('Cuentas')}
              >
                <CreditCard size={19} /> Ver tarjetas
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  onNavigate('Asistente');
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
                  <span>{bank.profile.displayName.toUpperCase()}</span>
                </div>
                {cardId && (
                  <CardArtwork cardId={cardId} className="wallet-bank-card" />
                )}
                <div className="wallet-front">
                  <span>
                    <CreditCard size={16} /> {bank.cards.length} tarjetas
                  </span>
                  <span>BANORTE</span>
                </div>
              </div>
              <div className="everyday-content">
                <div className="everyday-heading">
                  <h2 id="everyday-title">Tu cuenta personal</h2>
                  <Button
                    variant="ghost"
                    aria-label="Ver tarjetas de tu cuenta"
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
                    <span>
                      {bank.account.currency} · {bank.account.name}
                    </span>
                  </div>
                  <strong>{formatMoney(ledger.balanceCents)}</strong>
                </div>
                <Button
                  variant="ghost"
                  className="account-details"
                  onClick={() => onNavigate('Cuentas')}
                >
                  <CreditCard size={16} /> Ver mis cuentas{' '}
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
                <span className="concept-pill">Para ti</span>
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
                  onClick={() => onNavigate('Asistente')}
                >
                  Conoce tu asistente <ArrowRight size={17} />
                </Button>
                <div className="insight-mini" aria-hidden="true">
                  <span>Balance del historial</span>
                  <strong>{formatMoney(ledger.totals.net)}</strong>
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
              <Button variant="ghost" onClick={() => onNavigate('Movimientos')}>
                Ver historial <ArrowUpRight size={16} />
              </Button>
            </div>
            <span className="transaction-day">Actividad reciente · MXN</span>
            <div className="transaction-list">
              {ledger.ready && !ledger.movements.length && (
                <p className="movement-empty">
                  Aún no tienes movimientos. Registra tu primer ingreso o gasto.
                </p>
              )}
              {ledger.error && (
                <p role="alert" className="movement-error">
                  {ledger.error}
                </p>
              )}
              {ledger.movements.slice(0, 3).map((t) => (
                <div className="transaction-row" key={t.id}>
                  <span
                    className={`merchant-avatar ${t.type === 'income' ? 'incoming' : ''}`}
                  >
                    {t.description.slice(0, 1)}
                  </span>
                  <div className="merchant-copy">
                    <strong>{t.description}</strong>
                    <span>{movementLabel(t)}</span>
                  </div>
                  <div className="transaction-value">
                    <strong className={t.type === 'income' ? 'incoming' : ''}>
                      {t.type === 'income' ? '+' : '−'}{' '}
                      {formatMoney(t.amountCents)}
                    </strong>
                    <span>{formatMovementDate(t.date)}</span>
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
