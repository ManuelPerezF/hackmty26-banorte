import { useEffect, useRef } from 'react';
import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { formatMoney, formatMovementDate } from '@/shared/utils/money';
import type { Movement } from '../types/movimientos.types';
export function MovimientoDetail({
  movement,
  onClose,
}: {
  movement: Movement;
  onClose: () => void;
}) {
  const detail = useRef<HTMLElement>(null);
  useEffect(() => {
    detail.current?.focus();
  }, [movement.id]);
  return (
    <aside
      ref={detail}
      tabIndex={-1}
      id="movement-detail"
      className="movement-detail"
      aria-label={`Detalle de ${movement.description}`}
    >
      <div className="movement-detail-top">
        <span>Detalle del movimiento</span>
        <Button variant="ghost" aria-label="Cerrar detalle" onClick={onClose}>
          <X size={18} />
        </Button>
      </div>
      <div className={`movement-avatar ${movement.type}`} aria-hidden="true">
        {movement.type === 'income' ? (
          <ArrowDownLeft size={23} />
        ) : (
          <ArrowUpRight size={23} />
        )}
      </div>
      <h3>{movement.description}</h3>
      <p className={`movement-detail-amount ${movement.type}`}>
        {movement.type === 'income' ? '+' : '−'}
        {formatMoney(movement.amountCents)}
        <span>MXN</span>
      </p>
      <dl>
        <div>
          <dt>Tipo</dt>
          <dd>{movement.type === 'income' ? 'Ingreso' : 'Gasto'}</dd>
        </div>
        <div>
          <dt>Fecha</dt>
          <dd>{formatMovementDate(movement.date)}</dd>
        </div>
        <div>
          <dt>Categoría</dt>
          <dd>{movement.category}</dd>
        </div>
        <div>
          <dt>Origen</dt>
          <dd>
            {movement.source === 'manual'
              ? 'Registro manual'
              : 'Dato de ejemplo'}
          </dd>
        </div>
        <div>
          <dt>Cuenta</dt>
          <dd>Cuenta personal · 4281</dd>
        </div>
      </dl>
      {movement.notes && (
        <div className="movement-detail-note">
          <h4>Nota</h4>
          <p>{movement.notes}</p>
        </div>
      )}
      <p className="movement-disclosure">
        Información de demostración. No representa una operación bancaria real.
      </p>
    </aside>
  );
}
