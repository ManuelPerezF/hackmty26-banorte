'use client';
import { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Check,
  CreditCard,
  Eye,
  EyeOff,
  Landmark,
  Star,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { formatMoney, formatMovementDate } from '@/shared/utils/money';
import { useBank } from '@/modules/cuentas/context/bank-context';
import { movementLabel } from '@/modules/movimientos/services/movement-label';
import type { useMovimientos } from '@/modules/movimientos/hooks/useMovimientos';
import type { CardSelectionValue } from '../types/tarjetas.types';
import { CardArtwork } from './card-artwork';
export function TarjetasPanel({
  saved,
  onSave,
  ledger,
  onMovements,
}: {
  saved: CardSelectionValue | null;
  onSave: (value: CardSelectionValue) => Promise<void>;
  ledger: ReturnType<typeof useMovimientos>;
  onMovements: (instrumentId?: string) => void;
}) {
  const bank = useBank();
  const personalAccount = { ...bank.account, holder: bank.profile.displayName };
  const ownedCards = bank.cards.map((c) => ({
    id: c.id,
    productId: c.product.key,
    name: c.product.name,
    last4: c.last4,
    network: c.product.network,
    format: 'Física',
    status: c.status,
  }));
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(personalAccount.id);
  const [hidden, setHidden] = useState(false);
  const card = ownedCards.find((item) => item.id === selectedId);
  const preferred = saved?.cardId;
  const activity = ledger.movements.filter(
    (item) => !card || item.instrumentId === card.id,
  );
  const spent = activity
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amountCents, 0);
  const money = (cents: number) => (hidden ? '••••••' : formatMoney(cents));
  return (
    <section className="accounts-hub" aria-label="Tus cuentas y tarjetas">
      <div className="accounts-intro">
        <p>Tu dinero, en un mismo lugar.</p>
        <Button
          variant="ghost"
          className="accounts-privacy"
          aria-pressed={hidden}
          onClick={() => setHidden(!hidden)}
        >
          {hidden ? <Eye size={17} /> : <EyeOff size={17} />}{' '}
          {hidden ? 'Mostrar saldos' : 'Ocultar saldos'}
        </Button>
      </div>
      <div className="accounts-layout">
        <aside
          className="accounts-index"
          aria-label="Seleccionar cuenta o tarjeta"
        >
          <h2>
            Mis cuentas <span>1</span>
          </h2>
          <button
            className="account-index-item"
            aria-pressed={!card}
            onClick={() => setSelectedId(personalAccount.id)}
          >
            <span className="account-index-icon">
              <Landmark size={21} />
            </span>
            <span>
              <strong>Cuenta personal</strong>
              <small>MXN</small>
              <b>{money(ledger.balanceCents)}</b>
            </span>
            {!card && <Check className="account-selected-check" size={16} />}
          </button>
          <h2 className="cards-index-heading">
            Mis tarjetas <span>{ownedCards.length}</span>
          </h2>
          {!ownedCards.length && (
            <p className="accounts-index-note">No tienes tarjetas asignadas.</p>
          )}
          {ownedCards.map((item) => (
            <button
              key={item.id}
              className="account-index-item card-index-item"
              aria-pressed={selectedId === item.id}
              onClick={() => setSelectedId(item.id)}
            >
              <CardArtwork cardId={item.productId} className="card-index-art" />
              <span>
                <strong>Banorte {item.name}</strong>
                <small>
                  •••• {item.last4} · {item.format}
                </small>
              </span>
              {selectedId === item.id && (
                <Check className="account-selected-check" size={16} />
              )}
            </button>
          ))}
          <p className="accounts-index-note">
            Consulta una cuenta o tarjeta para ver su información y actividad.
          </p>
        </aside>
        <div className="accounts-content">
          {saveError && <p role="alert">{saveError}</p>}
          <section
            className={`account-overview ${card ? 'is-card-overview' : ''}`}
            aria-labelledby="account-detail-title"
          >
            <div className="account-overview-top">
              <span className="account-eyebrow">
                {card ? 'TU TARJETA' : 'TU CUENTA EN PESOS'}
              </span>
              <span className="account-active">
                <i />{' '}
                {card
                  ? card.status === 'active'
                    ? 'Activa'
                    : 'Inactiva'
                  : 'Activa'}
              </span>
            </div>
            <div className="account-detail-main">
              <div>
                <h2 id="account-detail-title">
                  {card ? `Banorte ${card.name}` : 'Cuenta personal'}
                </h2>
                <p className="account-detail-subtitle">
                  {card
                    ? `${card.network} · ${card.format} · •••• ${card.last4}`
                    : `${personalAccount.currency} · ${personalAccount.name}`}
                </p>
                <p className="account-amount-label">
                  {card
                    ? 'Gastos registrados con esta tarjeta'
                    : 'Dinero disponible'}
                </p>
                <p className="account-available">
                  {money(card ? spent : ledger.balanceCents)} <span>MXN</span>
                </p>
                <p className="account-amount-caption">
                  {card
                    ? 'Total de gastos de tu historial.'
                    : 'Saldo de tu cuenta, considerando ingresos y gastos.'}
                </p>
              </div>
              {card ? (
                <CardArtwork
                  cardId={card.productId}
                  className="account-detail-art"
                />
              ) : (
                <div className="account-peso-mark" aria-hidden="true">
                  $<span>MXN</span>
                </div>
              )}
            </div>
            <div className="account-detail-actions">
              <Button className="button" onClick={() => onMovements(card?.id)}>
                <ArrowRight size={17} /> Ver movimientos
              </Button>
              {card && (
                <Button
                  variant="ghost"
                  disabled={saving || preferred === card.productId}
                  onClick={async () => {
                    setSaving(true);
                    setSaveError('');
                    try {
                      await onSave({
                        cardId: card.productId,
                        format: 'fisica',
                        label: `Banorte ${card.name} · ${card.last4}`,
                      });
                    } catch (e) {
                      setSaveError(
                        e instanceof Error ? e.message : 'No se pudo guardar.',
                      );
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  <Star size={16} />
                  {preferred === card.productId
                    ? 'Tarjeta principal'
                    : 'Usar como principal'}
                </Button>
              )}
            </div>
            <dl className="account-facts">
              <div>
                <dt>Titular</dt>
                <dd>{personalAccount.holder}</dd>
              </div>
              <div>
                <dt>{card ? 'Cuenta del historial' : 'Moneda'}</dt>
                <dd>
                  {card ? 'Cuenta personal · MXN' : 'Peso mexicano (MXN)'}
                </dd>
              </div>
              <div>
                <dt>{card ? 'Formato' : 'Tarjetas en tu perfil'}</dt>
                <dd>
                  {card
                    ? 'Tarjeta física'
                    : ownedCards.map((c) => c.name).join(' y ') ||
                      'Sin tarjetas asignadas'}
                </dd>
              </div>
            </dl>
          </section>
          <section
            className="account-activity"
            aria-labelledby="account-activity-title"
          >
            <div className="account-activity-heading">
              <div>
                <h3 id="account-activity-title">Actividad reciente</h3>
                <p>
                  {card
                    ? `Movimientos asociados a tu ${card.name}.`
                    : 'Lo último que entró y salió de tu cuenta.'}
                </p>
              </div>
              <Button variant="ghost" onClick={() => onMovements(card?.id)}>
                Ver todo <ArrowUpRight size={16} />
              </Button>
            </div>
            {!ledger.ready ? (
              <p className="account-activity-empty">Cargando movimientos…</p>
            ) : activity.length ? (
              <ul className="account-activity-list">
                {activity.slice(0, 4).map((item) => (
                  <li key={item.id}>
                    <span className={`account-activity-icon ${item.type}`}>
                      {item.type === 'income' ? (
                        <ArrowDownLeft size={18} />
                      ) : (
                        <CreditCard size={18} />
                      )}
                    </span>
                    <div>
                      <strong>{item.description}</strong>
                      <small>
                        {movementLabel(item)} · {formatMovementDate(item.date)}
                      </small>
                    </div>
                    <b className={item.type}>
                      {item.type === 'income' ? '+' : '−'}
                      {money(item.amountCents)}
                    </b>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="account-activity-empty">
                <CreditCard size={25} />
                <p>
                  {card
                    ? 'Aún no hay movimientos con esta tarjeta.'
                    : 'Aún no hay movimientos en tu cuenta.'}
                </p>
                <Button variant="ghost" onClick={() => onMovements(card?.id)}>
                  Ir al historial <ArrowRight size={16} />
                </Button>
              </div>
            )}
            {ledger.error && (
              <p role="alert" className="movement-error">
                {ledger.error}
              </p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
