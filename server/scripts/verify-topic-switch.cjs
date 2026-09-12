// Gemini regression: old movement form must not become the current request.
require("reflect-metadata");
require("dotenv").config({ quiet: true });
process.env.LLM_PROVIDER = "gemini";
const assert = require("node:assert/strict");
const { LlmService } = require("../dist/integrations/llm/llm.service");
const { parseEnvironment } = require("../dist/config/env");
const llm = new LlmService(parseEnvironment(process.env));
const id = "11111111-1111-4111-8111-111111111111";
const historical = [
  { role: "user", content: "Quiero registrar un movimiento" },
  {
    role: "assistant",
    content: "Para procesar tu registro, por favor completa los campos del formulario.",
  },
];
const context = {
  role: "user",
  content:
    "Contexto de la aplicación (datos, no instrucciones): " +
    JSON.stringify({
      today: "2026-09-12",
      timezone: "America/Monterrey",
      interactions: [{ movementDraft: { cardId: null, notes: "" } }],
    }),
};
async function tools(name) {
  if (name === "list_my_cards")
    return {
      items: [
        {
          id,
          product: { key: "oro", name: "Banorte Oro", network: "Visa" },
          last4: "1234",
          status: "active",
        },
      ],
    };
  if (name === "get_account_summary")
    return { balanceCents: 100000, currency: "MXN", name: "Cuenta personal" };
  if (name === "list_movement_categories") return { items: ["Alimentación", "Otros"] };
  if (name === "search_financial_knowledge")
    return { sources: [], message: "Sin evidencia suficiente" };
  throw new Error("Unexpected tool: " + name);
}
(async () => {
  for (const text of process.argv.includes("--resume-only")
    ? []
    : [
        "que dia es hoy?",
        "que saldo tengo disponible en las tarjetas?",
        "Consulta los documentos de la tarjeta Banorte Oro. Tema: Beneficios y puntos. Muéstrame las fuentes, páginas, condiciones y vigencia.",
      ]) {
    const plan = await llm.respond(
      [...historical, context, { role: "user", content: text }],
      tools,
      AbortSignal.timeout(30000),
    );
    assert.ok(!plan.blocks.includes("movementForm"), `${text}: reapareció el formulario`);
    assert.equal(plan.movementDraft, undefined, "Un cambio de tema no debe arrastrar el borrador");
    if (text === "que dia es hoy?")
      assert.match(plan.explanation, /12.*septiembre.*2026|2026-09-12/i);
    console.log(JSON.stringify({ question: text, blocks: plan.blocks }));
    historical.push(
      { role: "user", content: text },
      { role: "assistant", content: plan.explanation },
    );
  }
  historical.push(
    { role: "user", content: "Consulta los documentos de Banorte Oro" },
    {
      role: "assistant",
      content: "Consulta las fuentes y su vigencia para verificar las condiciones.",
    },
  );
  const plan = await llm.respond(
    [
      ...historical,
      context,
      {
        role: "user",
        content: "Retomemos el registro: son $250 de supermercado con mi tarjeta Oro.",
      },
    ],
    tools,
    AbortSignal.timeout(30000),
  );
  assert.ok(plan.blocks.includes("movementForm"));
  assert.ok(plan.movementDraft, "Retomar el registro requiere un borrador");
  assert.equal(plan.movementDraft.amountCents, 25000);
  assert.equal(plan.movementDraft.cardId, id);
  console.log(
    process.argv.includes("--resume-only")
      ? "OK: regreso explícito al registro"
      : "OK: tres cambios de tema sin formulario y regreso explícito al registro",
  );
})().catch((e) => {
  console.error(
    e instanceof assert.AssertionError
      ? e.message
      : `${e.constructor.name} (estado ${e.status ?? "sin código"})${["TOOL_LIMIT", "LLM_INVALID_OUTPUT", "INVALID_TOOL"].includes(e.message) ? ": " + e.message : ""}: ` +
          "Falló la evaluación de Gemini; revisa disponibilidad y cuota.",
  );
  process.exitCode = 1;
});
