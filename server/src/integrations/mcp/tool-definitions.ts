import { comparisonSchema } from "../../modules/analisis/comparison";
import { knowledgeQuerySchema } from "../../modules/conocimiento/knowledge.schemas";
import { z } from "zod";
import { movementQuerySchema } from "../../modules/movimientos/schemas/movimiento.schema";
import { insightsSchema } from "../../modules/analisis/analisis.module";
import { goalQuerySchema } from "../../modules/metas/metas.module";
import { simulationSchema } from "../../modules/simulaciones/simulaciones.module";
export const toolDefinitions = {
  compare_spending_periods: {
    description:
      "Compara gastos de dos periodos explícitos inclusivos (first y second con from/to). Calcula diferencia y porcentaje; porcentaje null si base cero. No equivale al saldo de cuenta. Conserva categoría si el usuario la solicita.",
    schema: comparisonSchema,
  },
  search_financial_knowledge: {
    description:
      "Consulta folletos y guías de Clásica, Oro y Platinum. Obligatoria para beneficios, comisiones, seguros, requisitos o condiciones de productos. Filtra product si se conoce; includeHistorical solo para preguntas explícitamente históricas. Devuelve fragmentos con página y vigencia. Si no hay fuentes, reconoce que falta evidencia. No consulta saldos ni datos personales.",
    schema: knowledgeQuerySchema,
  },
  get_profile: { description: "Perfil del usuario autenticado.", schema: z.strictObject({}) },
  list_my_cards: { description: "Tarjetas asignadas a este usuario.", schema: z.strictObject({}) },
  get_account_summary: {
    description:
      "Saldo disponible e ingresos/gastos acumulados de la cuenta autenticada, en centavos MXN. No es deuda ni límite de crédito. Puede ser cero si aún no hay registros.",
    schema: z.strictObject({}),
  },
  list_movements: {
    description:
      "Historial propio, paginado y filtrado. Fechas inclusivas YYYY-MM-DD. Los totales corresponden a todo el filtro, items solo a la página. cardId es UUID propio; accountOnly=true selecciona movimientos sin tarjeta. No inventes registros si items está vacío.",
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
    description:
      "Gastos propios por categoría y serie temporal. from/to deben enviarse juntos, máximo 366 días; por defecto mes actual. share es proporción 0–1. Neto del periodo no es saldo de cuenta.",
    schema: insightsSchema,
  },
  list_goals: {
    description:
      "Consulta metas propias activas o archivadas. Devuelve objetivos, no dinero apartado ni progreso de ahorro. Pagina con page y pageSize.",
    schema: goalQuerySchema,
  },
  simulate_savings: {
    description:
      "Calcula un escenario de ahorro en MXN, sin mover dinero. Importes en centavos, tasa nominal anual en puntos base (500=5%). Usa solo supuestos expresos del usuario; nunca inventes una tasa. Devuelve totales, supuestos y calendario mensual.",
    schema: simulationSchema,
  },
  get_spending_forecast: {
    description:
      "Proyección de gasto al cierre del mes en curso: extrapola el promedio diario de lo ya gastado y suma los cargos fijos que aún no caen. Devuelve el avance contra el presupuesto total cuando existe. Es una estimación, no un compromiso; no consulta saldo.",
    schema: z.strictObject({}),
  },
  get_budgets: {
    description:
      "Presupuestos mensuales propios por categoría, con lo gastado del mes y su estado (on_track, warning a partir del 80%, exceeded al 100%). Si items está vacío, el usuario no ha configurado ninguno; no inventes límites.",
    schema: z.strictObject({}),
  },
  list_recurrences: {
    description:
      "Cargos e ingresos fijos mensuales propios, con su día del mes (1-28). Alimentan la proyección de cierre de mes.",
    schema: z.strictObject({}),
  },
  get_financial_health: {
    description:
      "Puntaje de salud financiera 0-100 del mes en curso: 40 puntos por tasa de ahorro, 35 por adherencia al presupuesto, 25 por avance de metas. Devuelve el desglose y en qué se basó. Sin presupuestos configurados el componente vale la mitad; sin metas vale cero.",
    schema: z.strictObject({}),
  },
  get_coach_actions: {
    description:
      "Sugerencias accionables calculadas por el servidor a partir de datos propios: presupuestos excedidos y aportaciones a metas cercanas a cumplirse. No las inventes tú; usa exactamente las que devuelve.",
    schema: z.strictObject({}),
  },
  contribute_to_goal: {
    description:
      "Ejecuta exclusivamente la aportación a meta ya aprobada por el usuario. No acepta ni cambia sus datos. Registra avance del plan; no mueve dinero de la cuenta.",
    schema: z.strictObject({}),
  },
  apply_goal_change: {
    description:
      "Aplica exclusivamente el cambio de meta ya confirmado. No acepta datos ni IDs del modelo.",
    schema: z.strictObject({}),
  },
  register_movement: {
    description:
      "Ejecuta exclusivamente el registro ya aprobado por el usuario. No acepta ni cambia sus datos.",
    schema: z.strictObject({}),
  },
} as const;
export type ToolName = keyof typeof toolDefinitions;

export const toolMetadata: Record<ToolName, { title: string; readOnly: boolean }> = {
  search_financial_knowledge: { title: "Consultar documentos bancarios", readOnly: true },
  compare_spending_periods: { title: "Comparar periodos", readOnly: true },
  get_profile: { title: "Consultar perfil", readOnly: true },
  list_my_cards: { title: "Consultar tarjetas", readOnly: true },
  get_account_summary: { title: "Consultar saldo", readOnly: true },
  list_movements: { title: "Consultar historial", readOnly: true },
  get_movement: { title: "Consultar movimiento", readOnly: true },
  list_movement_categories: { title: "Consultar categorías", readOnly: true },
  get_spending_insights: { title: "Analizar gastos", readOnly: true },
  list_goals: { title: "Consultar metas", readOnly: true },
  simulate_savings: { title: "Simular ahorro", readOnly: true },
  get_spending_forecast: { title: "Proyectar cierre de mes", readOnly: true },
  get_budgets: { title: "Consultar presupuestos", readOnly: true },
  list_recurrences: { title: "Consultar cargos fijos", readOnly: true },
  get_financial_health: { title: "Calcular salud financiera", readOnly: true },
  get_coach_actions: { title: "Sugerir acciones", readOnly: true },
  contribute_to_goal: { title: "Guardar aportación confirmada", readOnly: false },
  apply_goal_change: { title: "Guardar cambio de meta confirmado", readOnly: false },
  register_movement: { title: "Guardar movimiento confirmado", readOnly: false },
};
