import { goalDraftSchema } from "../modules/metas/goal-actions";
import { movementSchema } from "../modules/movimientos/schemas/movimiento.schema";
import { z } from "zod";
export const catalogId = "urn:banorte:a2ui:catalog:1";
export const uiPlanSchema = z.strictObject({
  title: z.string().min(1).max(120),
  explanation: z.string().max(2000),
  offTopic: z.boolean().optional(),
  goalDraft: goalDraftSchema.optional(),
  movementDraft: movementSchema.partial().optional(),
  knowledgeQuotes: z
    .array(
      z.strictObject({
        citation: z.string().regex(/^S[1-9]\d*$/),
        quote: z.string().min(15).max(600),
      }),
    )
    .max(5)
    .optional(),
  blocks: z
    .array(
      z.enum([
        "balance",
        "movements",
        "spending",
        "movementForm",
        "education",
        "cards",
        "goals",
        "savings",
        "comparison",
        "forecast",
        "budgets",
        "health",
        "coach",
        "points",
        "trace",
      ]),
    )
    .min(1)
    .max(15),
});
export type UiPlan = z.infer<typeof uiPlanSchema>;
const common = { id: z.string().min(1).max(100) };
export const componentSchema = z.discriminatedUnion("component", [
  z.strictObject({ ...common, component: z.literal("Column"), children: z.array(z.string()) }),
  z.strictObject({
    ...common,
    component: z.literal("Text"),
    text: z.string().max(4000),
    variant: z.enum(["h2", "body"]),
  }),
  ...(
    [
      "BanorteBalance",
      "BanorteMovementTable",
      "BanorteSpendingChart",
      "BanorteMovementForm",
      "BanorteConfirmation",
      "BanorteActionResult",
      "BanortePeriodSelector",
      "BanorteCardList",
      "BanorteGoalList",
      "BanorteGoalConfirmation",
      "BanorteSavingsSimulator",
      "BanorteSources",
      "BanortePeriodComparison",
      "BanorteKnowledgeFacts",
      "BanorteForecast",
      "BanorteBudgetList",
      "BanorteHealthScore",
      "BanorteCoachActions",
      "BanorteContributionConfirmation",
      "BanorteRewardPoints",
      "BanorteBalanceTrace",
    ] as const
  ).map((name) =>
    z.strictObject({
      ...common,
      component: z.literal(name),
      data: z.strictObject({ path: z.string().regex(/^\//) }),
      action: z.string().optional(),
    }),
  ),
]);
export const a2uiMessageSchema = z.union([
  z.strictObject({
    version: z.literal("v0.9.1"),
    createSurface: z.strictObject({ surfaceId: z.string(), catalogId: z.literal(catalogId) }),
  }),
  z.strictObject({
    version: z.literal("v0.9.1"),
    updateComponents: z.strictObject({
      surfaceId: z.string(),
      components: z.array(componentSchema),
    }),
  }),
  z.strictObject({
    version: z.literal("v0.9.1"),
    updateDataModel: z.strictObject({
      surfaceId: z.string(),
      path: z.string(),
      value: z.record(z.string(), z.unknown()),
    }),
  }),
]);
export function surface(
  surfaceId: string,
  title: string,
  explanation: string,
  components: unknown[],
  data: Record<string, unknown>,
) {
  const items = [
    { id: "title", component: "Text", text: title, variant: "h2" },
    { id: "explanation", component: "Text", text: explanation, variant: "body" },
    ...components,
  ].map((c) => componentSchema.parse(c));
  const ids = items.map((c) => c.id);
  if (new Set(ids).size !== ids.length || ids.includes("root")) throw new Error("INVALID_UI_IDS");
  const messages = [
    { version: "v0.9.1", createSurface: { surfaceId, catalogId } },
    {
      version: "v0.9.1",
      updateComponents: {
        surfaceId,
        components: [{ id: "root", component: "Column", children: ids }, ...items],
      },
    },
    { version: "v0.9.1", updateDataModel: { surfaceId, path: "/", value: data } },
  ];
  return messages.map((m) => a2uiMessageSchema.parse(m));
}
export const catalog = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: catalogId,
  catalogId,
  title: "Banorte financial components",
  description:
    "Catálogo de componentes propios para registrar en el renderer React. Datos resueltos desde el data model.",
  components: Object.fromEntries(
    componentSchema.options.map((s) => [s.shape.component.value, z.toJSONSchema(s)]),
  ),
  functions: {},
  $defs: {
    anyComponent: {
      oneOf: componentSchema.options.map((s) => ({
        $ref: `#/components/${s.shape.component.value}`,
      })),
    },
    theme: { type: "object", additionalProperties: false },
  },
};
