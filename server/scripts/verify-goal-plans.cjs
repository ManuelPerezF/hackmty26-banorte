// Real Gemini with synthetic goal data only. Never writes to banking endpoints.
require("reflect-metadata");
require("dotenv").config({ quiet: true });
const assert = require("node:assert/strict");
const { LlmService } = require("../dist/integrations/llm/llm.service");
const { parseEnvironment } = require("../dist/config/env");
const llm = new LlmService(parseEnvironment(process.env));
(async () => {
  const id = "11111111-1111-4111-8111-111111111111";
  for (const [content, operation] of [
    [
      "Quiero crear una meta llamada Viaje a Oaxaca por 15000 pesos para el 15 de diciembre de 2027.",
      "create",
    ],
    ["Quiero archivar mi meta Viaje a Oaxaca. Muéstrame el cambio para revisarlo.", "archive"],
  ]) {
    const plan = await llm.respond(
      [{ role: "user", content }],
      async (name) => {
        if (name === "list_goals")
          return {
            items:
              operation === "create"
                ? []
                : [
                    {
                      id,
                      name: "Viaje a Oaxaca",
                      targetCents: 1500000,
                      deadline: "2027-12-15",
                      status: "active",
                      updatedAt: 1789230000000,
                    },
                  ],
            total: operation === "create" ? 0 : 1,
            page: 1,
            pageSize: 20,
          };
        if (name === "get_profile")
          return { displayName: "Evaluación", timezone: "America/Monterrey" };
        throw Error("UNEXPECTED_TOOL");
      },
      AbortSignal.timeout(90000),
    );
    assert.ok(plan.blocks.includes("goals"));
    assert.equal(plan.goalDraft?.operation, operation);
    if (operation === "create") {
      assert.equal(plan.goalDraft.name, "Viaje a Oaxaca");
      assert.equal(plan.goalDraft.targetCents, 1500000);
      assert.equal(plan.goalDraft.deadline, "2027-12-15");
    } else assert.equal(plan.goalDraft.goalId, id);
    console.log(`Gemini OK: ${operation}`);
  }
})().catch((e) => {
  console.error(
    JSON.stringify({
      name: e.name,
      status: e.status,
      code: ["LLM_INVALID_OUTPUT", "INVALID_TOOL", "TOOL_LIMIT"].includes(e.message)
        ? e.message
        : undefined,
      issues: e.issues?.map((i) => ({ path: i.path, code: i.code })),
      assertion: e instanceof assert.AssertionError ? e.message : undefined,
    }),
  );
  process.exitCode = 1;
});
