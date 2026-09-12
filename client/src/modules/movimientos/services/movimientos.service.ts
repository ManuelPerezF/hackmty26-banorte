import type { Movement, MovementFilters } from '../types/movimientos.types';
export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function parseAmountCents(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(normalized))
    throw new Error('Escribe un monto positivo con hasta dos decimales.');
  const [whole, fraction = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (cents <= 0) throw new Error('El monto debe ser mayor a cero.');
  return cents;
}
export function sortMovements(items: readonly Movement[]) {
  return [...items].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
  );
}
export function movementTotals(items: readonly Movement[]) {
  const income = items
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amountCents, 0);
  const expense = items
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amountCents, 0);
  return { income, expense, net: income - expense };
}
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
export function filterMovements(
  items: readonly Movement[],
  filters: MovementFilters,
) {
  const query = normalize(filters.query.trim());
  return sortMovements(
    items.filter(
      (item) =>
        (!query ||
          normalize(
            `${item.description} ${item.category} ${item.notes} ${item.card ? `${item.card.product.name} ${item.card.last4}` : (item.account?.name ?? '')}`,
          ).includes(query)) &&
        (!filters.instrumentId ||
          (item.instrumentId ?? item.card?.id ?? item.account?.id) ===
            filters.instrumentId) &&
        (filters.type === 'all' || item.type === filters.type) &&
        (!filters.category || item.category === filters.category) &&
        (!filters.from || item.date >= filters.from) &&
        (!filters.to || item.date <= filters.to),
    ),
  );
}
