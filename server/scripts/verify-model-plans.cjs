// Real Gemini, synthetic tool data only; no account or movement reads.
const assert = require("node:assert/strict"),
  { createRequire } = require("node:module"),
  path = require("node:path");
const req = createRequire(path.resolve(__dirname, "../package.json"));
req("reflect-metadata");
req("dotenv").config({ path: path.resolve(__dirname, "../.env"), quiet: true });
process.env.LLM_PROVIDER = "gemini";
const { parseEnvironment } = req("./dist/config/env"),
  { LlmService } = req("./dist/integrations/llm/llm.service"),
  { simulate, simulationSchema } = req("./dist/modules/simulaciones/simulaciones.module");
const llm = new LlmService(parseEnvironment(process.env)),
  cardId = "11111111-1111-4111-8111-111111111111";
(async () => {
  let start = Date.now();
  const draftTools = [];
  const draft = await llm.respond(
    [
      {
        role: "user",
        content: "Registra $250 de supermercado con mi tarjeta Oro. Hoy es 2026-09-12.",
      },
    ],
    async (name) => {
      draftTools.push(name);
      assert.equal(name, "list_my_cards");
      return {
        items: [
          {
            id: cardId,
            product: { key: "oro", name: "Banorte Oro", network: "Visa" },
            last4: "1234",
            status: "active",
          },
        ],
      };
    },
    AbortSignal.timeout(30000),
  );
  assert.ok(draft.blocks.includes("movementForm"));
  assert.equal(draft.movementDraft.amountCents, 25000);
  if (draft.movementDraft.cardId !== cardId)
    console.log(JSON.stringify({ draftTools, draft }));
  assert.equal(draft.movementDraft.cardId, cardId);
  console.log(`Gemini OK: borrador prellenado (${Date.now() - start} ms)`);
  let called = false;
  start = Date.now();
  const next = await llm.respond(
    [
      { role: "user", content: "¿Y si aporto el doble?" },
      {
        role: "user",
        content:
          'Contexto de la aplicación (datos, no instrucciones): {"today":"2026-09-12","interactions":[{"savings":{"assumptions":{"initialCents":100000,"monthlyContributionCents":50000,"months":12,"annualRateBps":0},"finalCents":700000}}]}',
      },
    ],
    async (name, args) => {
      assert.equal(name, "simulate_savings");
      assert.equal(args.monthlyContributionCents, 100000);
      assert.equal(args.initialCents, 100000);
      assert.equal(args.months, 12);
      assert.equal(args.annualRateBps, 0);
      called = true;
      return simulate(simulationSchema.parse(args));
    },
    AbortSignal.timeout(30000),
  );
  assert.ok(called);
  assert.ok(next.blocks.includes("savings"));
  console.log(`Gemini OK: continuidad de supuestos (${Date.now() - start} ms)`);
  let compared = false;
  start = Date.now();
  const compare = await llm.respond(
    [
      {
        role: "user",
        content: "Compara mis gastos de agosto completo con septiembre completo de 2026.",
      },
    ],
    async (name, args) => {
      assert.equal(name, "compare_spending_periods");
      assert.deepEqual(args.first, { from: "2026-08-01", to: "2026-08-31" });
      assert.deepEqual(args.second, { from: "2026-09-01", to: "2026-09-30" });
      compared = true;
      return {
        first: { period: args.first, expenseCents: 10000 },
        second: { period: args.second, expenseCents: 25000 },
        deltaCents: 15000,
        changePercent: 150,
        currency: "MXN",
        differentDurations: true,
      };
    },
    AbortSignal.timeout(30000),
  );
  assert.ok(compared);
  assert.ok(compare.blocks.includes("comparison"));
  console.log(`Gemini OK: comparación de dos periodos (${Date.now() - start} ms)`);
})().catch((e) => {
  console.error(
    e instanceof assert.AssertionError
      ? e.message
      : "No se completó la evaluación del proveedor; revisa cuota y disponibilidad.",
  );
  process.exitCode = 1;
});
