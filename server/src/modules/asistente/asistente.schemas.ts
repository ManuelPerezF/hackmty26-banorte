import { goalChangeSchema } from "../metas/goal-actions";
import { categories } from "../movimientos/schemas/movimiento.schema";
import { z } from "zod";
import { dateSchema, movementSchema } from "../movimientos/schemas/movimiento.schema";
import { simulationSchema } from "../simulaciones/simulaciones.module";
export const conversationSchema = z.strictObject({
  title: z.string().trim().min(1).max(80).default("Nueva conversación"),
});
export const messageSchema = z.strictObject({ content: z.string().trim().min(1).max(4000) });
const common = { surfaceId: z.uuid(), revision: z.number().int().nonnegative() };
export const actionSchema = z.discriminatedUnion("event", [
  z.strictObject({ ...common, event: z.literal("prepare_goal"), values: goalChangeSchema }),
  z.strictObject({ ...common, event: z.literal("confirm_goal"), actionId: z.uuid() }),
  z.strictObject({ ...common, event: z.literal("cancel_goal"), actionId: z.uuid() }),
  z.strictObject({
    ...common,
    event: z.literal("list_goals"),
    values: z.strictObject({
      status: z.enum(["active", "archived"]),
      page: z.number().int().min(1).max(100000).default(1),
    }),
  }),
  z.strictObject({
    ...common,
    event: z.literal("select_category"),
    values: z.strictObject({
      category: z.enum(categories).nullable(),
      page: z.number().int().min(1).max(100000).default(1),
    }),
  }),
  z.strictObject({ ...common, event: z.literal("simulate_savings"), values: simulationSchema }),
  z.strictObject({
    ...common,
    event: z.literal("change_period"),
    values: z
      .strictObject({ from: dateSchema, to: dateSchema })
      .refine(
        (v) => v.from <= v.to && (Date.parse(v.to) - Date.parse(v.from)) / 86400000 < 366,
        "Rango inválido o mayor a 366 días.",
      ),
  }),
  z.strictObject({ ...common, event: z.literal("submit_movement_form"), values: movementSchema }),
  z.strictObject({ ...common, event: z.literal("confirm_movement"), actionId: z.uuid() }),
  z.strictObject({ ...common, event: z.literal("cancel_movement"), actionId: z.uuid() }),
]);
export type AgentAction = z.infer<typeof actionSchema>;

export const turnInputSchema = z.union([
  z.strictObject({ kind: z.literal("message"), content: messageSchema.shape.content }),
  ...actionSchema.options.map((s) => s.extend({ kind: z.literal("action") })),
]);
