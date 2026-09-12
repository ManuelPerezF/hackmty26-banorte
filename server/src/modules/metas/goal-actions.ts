import { z } from "zod";
import { dateSchema } from "../movimientos/schemas/movimiento.schema";
export const goalFields = z.strictObject({
  name: z.string().trim().min(1).max(80),
  targetCents: z.number().int().positive().max(99999999999),
  deadline: dateSchema.nullable().default(null),
});
const existing = { goalId: z.uuid(), expectedUpdatedAt: z.number().int().nonnegative() };
export const goalChangeSchema = z.discriminatedUnion("operation", [
  goalFields.extend({ operation: z.literal("create") }),
  goalFields.extend({ ...existing, operation: z.literal("edit") }),
  z.strictObject({ ...existing, operation: z.enum(["archive", "restore"]) }),
]);
export const goalPendingSchema = z.strictObject({
  kind: z.literal("goal"),
  change: goalChangeSchema,
});
export const goalDraftSchema = goalFields.partial().extend({
  goalId: z.uuid().optional(),
  operation: z.enum(["create", "edit", "archive", "restore"]).default("create"),
});
export type GoalChange = z.infer<typeof goalChangeSchema>;
