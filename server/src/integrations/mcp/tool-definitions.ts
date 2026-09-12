import { z } from "zod";
import { movementQuerySchema } from "../../modules/movimientos/schemas/movimiento.schema";
import { insightsSchema } from "../../modules/analisis/analisis.module";
export const toolDefinitions = {
  get_profile: { description: "Perfil del usuario autenticado.", schema: z.strictObject({}) },
  list_my_cards: { description: "Tarjetas asignadas a este usuario.", schema: z.strictObject({}) },
  get_account_summary: {
    description: "Saldo e ingresos/gastos de la cuenta actual.",
    schema: z.strictObject({}),
  },
  list_movements: {
    description: "Historial filtrado y totales. Usar fechas YYYY-MM-DD.",
    schema: movementQuerySchema,
  },
  get_movement: {
    description: "Detalle de un movimiento propio.",
    schema: z.strictObject({ id: z.uuid() }),
  },
  list_movement_categories: {
    description: "Categorías permitidas para registrar movimientos.",
    schema: z.strictObject({}),
  },
  get_spending_insights: {
    description: "Gráfica de gastos por categoría y serie del periodo.",
    schema: insightsSchema,
  },
  register_movement: {
    description:
      "Ejecuta exclusivamente el registro ya aprobado por el usuario. No acepta ni cambia sus datos.",
    schema: z.strictObject({}),
  },
} as const;
export type ToolName = keyof typeof toolDefinitions;
