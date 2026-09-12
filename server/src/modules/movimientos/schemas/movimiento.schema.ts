import { z } from 'zod';

export const categories = ['Nómina', 'Vivienda', 'Alimentación', 'Transporte', 'Entretenimiento', 'Compras', 'Servicios', 'Otros'] as const;
export const dateSchema = z.iso.date().refine(value => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Fecha inválida');
export const movementSchema = z.strictObject({
  description: z.string().trim().min(1).max(80),
  amountCents: z.number().int().positive().max(99999999999),
  type: z.enum(['income', 'expense']),
  category: z.enum(categories),
  date: dateSchema,
  notes: z.string().trim().max(500).default(''),
});
export const movementQuerySchema = z.strictObject({
  query: z.string().trim().max(100).optional(),
  type: z.enum(['income', 'expense']).optional(),
  category: z.enum(categories).optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).refine(value => !value.from || !value.to || value.from <= value.to, { message: 'La fecha inicial debe ser anterior o igual a la final.', path: ['to'] });
export const idempotencySchema = z.uuid();
export type CreateMovement = z.infer<typeof movementSchema>;
export type MovementQuery = z.infer<typeof movementQuerySchema>;

export function todayInTimezone(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
