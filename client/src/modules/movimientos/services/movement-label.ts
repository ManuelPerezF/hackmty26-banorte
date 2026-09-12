import type { Movement } from '../types/movimientos.types';
export function movementLabel(m: Movement) {
  return m.card
    ? `${m.card.product.name} · ${m.card.last4}`
    : (m.account?.name ?? 'Cuenta personal');
}
