// Real Gemini + public product documents. Rejects every personal-data tool.
const assert = require("node:assert/strict"),
  { createRequire } = require("node:module"),
  path = require("node:path");
const req = createRequire(path.resolve(__dirname, "../package.json"));
req("reflect-metadata");
req("dotenv").config({ path: path.resolve(__dirname, "../.env"), quiet: true });
process.env.LLM_PROVIDER = "gemini";
const { parseEnvironment } = req("./dist/config/env"),
  { PrismaService } = req("./dist/database/prisma.service"),
  { KnowledgeService } = req("./dist/modules/conocimiento/knowledge.service"),
  { knowledgeQuerySchema } = req("./dist/modules/conocimiento/knowledge.schemas"),
  { LlmService } = req("./dist/integrations/llm/llm.service");
const { documentQuote } = req("./dist/modules/conocimiento/document-quote");
const env = parseEnvironment(process.env),
  db = new PrismaService(env),
  rag = new KnowledgeService(db, env),
  sources = new Map();
(async () => {
  try {
    const start = Date.now(),
      plan = await new LlmService(env).respond(
        [
          {
            role: "user",
            content:
              "¿Qué beneficios tiene Banorte Oro y cómo acumula puntos? Muestra una tabla documental con fuentes y vigencia.",
          },
        ],
        async (name, args) => {
          assert.equal(name, "search_financial_knowledge");
          const r = await rag.search(knowledgeQuerySchema.parse(args));
          return {
            ...r,
            sources: r.sources.map((s) => {
              if (!sources.has(s.id)) sources.set(s.id, { ...s, citation: `S${sources.size + 1}` });
              return sources.get(s.id);
            }),
          };
        },
        AbortSignal.timeout(30000),
      );
    const valid = (plan.knowledgeQuotes ?? []).filter((q) =>
      [...sources.values()].some(
        (s) => s.citation === q.citation && documentQuote(s.excerpt, q.quote),
      ),
    );
    console.log(
      JSON.stringify({
        quotes: plan.knowledgeQuotes,
        matched: valid.length,
        sourceCount: sources.size,
      }),
    );
    assert.ok(valid.length > 0);
    console.log(
      JSON.stringify({
        ms: Date.now() - start,
        quotes: valid.length,
        sources: sources.size,
        blocks: plan.blocks,
      }),
    );
  } finally {
    await db.$disconnect();
  }
})().catch((e) => {
  console.error(
    e instanceof assert.AssertionError
      ? e.message
      : "Falló la prueba documental del proveedor. Revisa cuota y conexión.",
  );
  process.exitCode = 1;
});
