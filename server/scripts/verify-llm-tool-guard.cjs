// Controlled SDK responses: a model can suggest tools, never authorize a write.
require("reflect-metadata");
const assert = require("node:assert/strict");
const sdk = require("@google/genai");
const RealClient = sdk.GoogleGenAI;
(async () => {
  for (const forbidden of ["apply_goal_change", "register_movement", "create_goal"]) {
    let count = 0,
      executed = [];
    sdk.GoogleGenAI = class {
      models = {
        generateContent: async (request) => {
          count++;
          if (count === 1)
            return {
              candidates: [
                {
                  content: {
                    role: "model",
                    parts: [{ functionCall: { id: "a", name: forbidden, args: {} } }],
                  },
                },
              ],
              functionCalls: [{ id: "a", name: forbidden, args: {} }],
            };
          if (count === 2) {
            assert.ok(
              request.contents.some((c) =>
                c.parts?.some(
                  (p) => p.functionResponse?.response?.result?.error === "TOOL_NOT_ALLOWED",
                ),
              ),
            );
            return {
              candidates: [
                {
                  content: {
                    role: "model",
                    parts: [{ functionCall: { id: "b", name: "list_goals", args: {} } }],
                  },
                },
              ],
              functionCalls: [{ id: "b", name: "list_goals", args: {} }],
            };
          }
          if (count === 3)
            return {
              candidates: [
                { content: { role: "model", parts: [{ text: "Prepara una meta para revisar." }] } },
              ],
            };
          return {
            text: JSON.stringify({
              title: "Tu meta",
              explanation: "Revisa antes de confirmar.",
              blocks: ["goals"],
              goalDraft: { operation: "create", name: "Viaje", targetCents: 10000 },
            }),
          };
        },
      };
    };
    const { LlmService } = require("../dist/integrations/llm/llm.service");
    const plan = await new LlmService({
      GEMINI_API_KEY: "test-key",
      LLM_MODEL: "test-model",
    }).respond(
      [{ role: "user", content: "Crear meta" }],
      async (name) => {
        executed.push(name);
        return { items: [], total: 0 };
      },
      AbortSignal.timeout(5000),
    );
    assert.deepEqual(executed, ["list_goals"]);
    assert.equal(plan.goalDraft.operation, "create");
    console.log(`OK: ${forbidden} no se ejecuta y el modelo puede continuar`);
  }
})()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => {
    sdk.GoogleGenAI = RealClient;
  });
