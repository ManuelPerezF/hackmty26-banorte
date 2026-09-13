import { z } from 'zod';

// Cada bloque recibe el valor YA resuelto en su ruta del data model
// (`/forecast`, `/budgets`…): el schema describe ese valor, no su envoltura.
const cents = z.number().int();

export const forecastSchema = z.object({
  spentCents: cents,
  dailyAverageCents: cents,
  projectedVariableCents: cents,
  pendingFixedCents: cents,
  projectedTotalCents: cents,
  daysElapsed: z.number().int(),
  daysRemaining: z.number().int(),
  budgetTotalCents: cents,
  budgetUsagePct: z.number().nullable(),
});

export const budgetsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
      limitCents: cents,
      spentCents: cents,
      remainingCents: cents,
      usagePct: z.number(),
      status: z.enum(['on_track', 'warning', 'exceeded']),
    }),
  ),
  totalLimitCents: cents,
  totalSpentCents: cents,
});

export const healthSchema = z.object({
  score: z.number().int().min(0).max(100),
  grade: z.string(),
  breakdown: z.object({
    savings: z.number(),
    budgets: z.number(),
    goals: z.number(),
  }),
  basis: z.object({
    hasIncome: z.boolean(),
    budgetCount: z.number().int(),
    goalCount: z.number().int(),
  }),
});

export const coachSchema = z.object({
  items: z.array(
    z.union([
      z.object({
        type: z.literal('contribute_goal'),
        label: z.string(),
        goalId: z.string(),
        goalName: z.string(),
        amountCents: cents,
      }),
      z.object({ type: z.literal('create_goal'), label: z.string() }),
      z.object({
        type: z.literal('review_budget'),
        label: z.string(),
        category: z.string(),
        overspentCents: cents,
      }),
    ]),
  ),
});
