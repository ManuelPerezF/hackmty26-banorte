import { categories, demoMovements } from '../data/demo-movimientos.ts';
import type {
  Movement,
  MovementInput,
  MovementFilters,
} from '../types/movimientos.types';
export const MOVEMENTS_STORAGE_KEY = 'banorte.demo.movements.v1';
export const signedAmount = (movement: Movement) =>
  movement.type === 'income' ? movement.amountCents : -movement.amountCents;
export const OPENING_BALANCE_CENTS =
  28465000 - demoMovements.reduce((sum, item) => sum + signedAmount(item), 0);
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
export function createMovement(
  input: MovementInput,
  today = localDateKey(),
): Movement {
  const description = input.description.trim();
  if (!description || description.length > 80)
    throw new Error('Escribe un concepto de hasta 80 caracteres.');
  if (!['income', 'expense'].includes(input.type))
    throw new Error('Elige ingreso o gasto.');
  if (!(categories as readonly string[]).includes(input.category))
    throw new Error('Elige una categoría de la lista.');
  if (!validDate(input.date) || input.date > today)
    throw new Error('Elige una fecha válida que no sea posterior a hoy.');
  if (input.notes.length > 500)
    throw new Error('La nota puede tener hasta 500 caracteres.');
  return {
    id: crypto.randomUUID(),
    description,
    amountCents: parseAmountCents(input.amount),
    type: input.type,
    category: input.category,
    date: input.date,
    notes: input.notes.trim(),
    createdAt: Date.now(),
    source: 'manual',
  };
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
            `${item.description} ${item.category} ${item.notes}`,
          ).includes(query)) &&
        (filters.type === 'all' || item.type === filters.type) &&
        (!filters.category || item.category === filters.category) &&
        (!filters.from || item.date >= filters.from) &&
        (!filters.to || item.date <= filters.to),
    ),
  );
}
export function decodeMovements(raw: string | null): Movement[] {
  if (raw === null) return [...demoMovements];
  const parsed: unknown = JSON.parse(raw);
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('version' in parsed) ||
    parsed.version !== 1 ||
    !('items' in parsed) ||
    !Array.isArray(parsed.items)
  )
    throw new Error('Historial local inválido.');
  const ids = new Set<string>();
  for (const value of parsed.items as unknown[]) {
    if (!value || typeof value !== 'object')
      throw new Error('Movimiento local inválido.');
    const item = value as Record<string, unknown>;
    if (
      typeof item.id !== 'string' ||
      !item.id ||
      ids.has(item.id) ||
      typeof item.description !== 'string' ||
      !item.description.trim() ||
      item.description.length > 80 ||
      typeof item.amountCents !== 'number' ||
      !Number.isSafeInteger(item.amountCents) ||
      item.amountCents <= 0 ||
      item.amountCents > 99999999999 ||
      !['income', 'expense'].includes(String(item.type)) ||
      typeof item.category !== 'string' ||
      !(categories as readonly string[]).includes(item.category) ||
      typeof item.date !== 'string' ||
      !validDate(item.date) ||
      typeof item.notes !== 'string' ||
      item.notes.length > 500 ||
      typeof item.createdAt !== 'number' ||
      !Number.isFinite(item.createdAt) ||
      !['demo', 'manual'].includes(String(item.source))
    )
      throw new Error('Movimiento local inválido.');
    ids.add(item.id);
  }
  return sortMovements(parsed.items as Movement[]);
}
export function encodeMovements(items: readonly Movement[]) {
  return JSON.stringify({ version: 1, items });
}
export async function loadMovements(): Promise<Movement[]> {
  return decodeMovements(localStorage.getItem(MOVEMENTS_STORAGE_KEY));
}
export function saveMovements(items: readonly Movement[]) {
  localStorage.setItem(MOVEMENTS_STORAGE_KEY, encodeMovements(items));
}
