// Integration check: temporary user, real PostgreSQL + MCP + embeddings, controlled conversational model.
// Run after build/ingest: node scripts/verify-rag.cjs (requires a free port 3002).
const assert = require("node:assert/strict");
const { randomUUID, randomBytes } = require("node:crypto");
const path = require("node:path");
const { createRequire } = require("node:module");
const req = createRequire(path.resolve(__dirname, "../package.json"));
req("reflect-metadata");
req("dotenv").config({ path: path.resolve(__dirname, "../.env"), quiet: true });
process.env.PORT = "3002";
process.env.MCP_ENTRY = path.resolve(__dirname, "../../mcp/dist/server.js");
const { NestFactory } = req("@nestjs/core");
const { AppModule } = req("./dist/app.module.js");
const { LlmService } = req("./dist/integrations/llm/llm.service.js");
const { McpService } = req("./dist/integrations/mcp/mcp.service.js");
const { AuthService } = req("./dist/modules/autenticacion/auth.service.js");
const { KnowledgeService } = req("./dist/modules/conocimiento/knowledge.service.js");
const { knowledgeQuerySchema } = req("./dist/modules/conocimiento/knowledge.schemas.js");
const { normalizeVector } = req("./dist/modules/conocimiento/embeddings.js");
const { chunkPage } = req("./dist/modules/conocimiento/ingest.cli.js");
const { Client } = req("pg");
const db = new Client({ connectionString: process.env.DATABASE_URL });
const base = "http://127.0.0.1:3002/api/v1";
const origin = "http://127.0.0.1:3000";
let app, userId;
async function call(route, method = "GET", body, auth, key) {
  const response = await fetch(base + route, {
    method,
    headers: {
      Origin: origin,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(auth ? { Cookie: auth.cookie, "X-CSRF-Token": auth.csrf } : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const type = response.headers.get("content-type") ?? "";
  return {
    status: response.status,
    headers: response.headers,
    body: type.includes("application/pdf")
      ? Buffer.from(await response.arrayBuffer())
      : await response.json(),
  };
}
(async () => {
  await db.connect();
  const original = (
    await db.query(
      'SELECT (SELECT count(*) FROM "Movement")::int AS movements, (SELECT count(*) FROM "User")::int AS users',
    )
  ).rows[0];
  try {
    assert.throws(() => normalizeVector([1, 2]), /DIMENSIONS/);
    assert.throws(() => normalizeVector(Array(768).fill(0)), /EMPTY/);
    const vector = normalizeVector(Array(768).fill(1));
    assert.ok(Math.abs(Math.hypot(...vector) - 1) < 1e-10);
    assert.equal(chunkPage("2").length, 0);
    const chunks = chunkPage("Texto bancario para preservar contenido. ".repeat(150));
    assert.ok(chunks.length > 1 && chunks.every((c) => c.length <= 1700));
    assert.equal(
      knowledgeQuerySchema.safeParse({ query: "prueba", product: "infinite" }).success,
      false,
    );
    assert.equal(knowledgeQuerySchema.safeParse({ query: "prueba", limit: 99 }).success, false);
    assert.equal(
      knowledgeQuerySchema.safeParse({ query: "prueba", profileId: randomUUID() }).success,
      false,
    );
    const stats = (
      await db.query(
        'SELECT (SELECT count(*) FROM "KnowledgeDocument" WHERE active)::int AS docs, count(*)::int AS chunks, min(vector_dims(embedding)) AS dimensions FROM "KnowledgeChunk"',
      )
    ).rows[0];
    assert.equal(stats.docs, 6);
    assert.equal(stats.chunks, 94);
    assert.equal(stats.dimensions, 768);
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api/v1");
    app.enableCors({
      origin,
      credentials: true,
      allowedHeaders: ["Content-Type", "X-CSRF-Token", "Idempotency-Key"],
    });
    const rag = app.get(KnowledgeService);
    let modelMode = "sources";
    app.get(LlmService).respond = async (_history, execute) => {
      if (modelMode === "failed") {
        try {
          await execute("search_financial_knowledge", {
            query: "beneficios platinum",
            product: "platinum",
          });
        } catch {}
        return {
          title: "Consulta no disponible",
          explanation: "Respuesta inventada que debe descartarse.",
          blocks: ["education"],
        };
      }
      const result = await execute(
        "search_financial_knowledge",
        modelMode === "sources"
          ? { query: "¿Cuántas visitas LoungeKey incluye Platinum?", product: "platinum" }
          : { query: "receta de pastel de zanahoria y temperatura para hornear" },
      );
      return {
        title: "Documentos de Platinum",
        explanation: `Consulta documental verificada [${result.sources[0]?.citation ?? "S999"}]. Cita inválida [S999].`,
        blocks: ["education"],
      };
    };
    await app.listen(3002, "127.0.0.1");
    const email = `rag-check-${randomUUID()}@example.test`,
      password = randomBytes(24).toString("base64url");
    userId = (
      await app.get(AuthService).register({ email, password, displayName: "Verificación RAG" })
    ).user.id;
    const login = await call("/auth/login", "POST", { email, password });
    assert.equal(login.status, 200);
    const auth = {
      cookie: login.headers.get("set-cookie").split(";")[0],
      csrf: login.body.csrfToken,
    };
    const identity = (await app.get(AuthService).resolve(auth.cookie.split("=")[1])).identity;
    await app
      .get(McpService)
      .withClient(identity, ["search_financial_knowledge"], undefined, async (client) => {
        const tools = await client.listTools();
        assert.equal(tools.tools.length, 12);
        assert.equal(
          tools.tools.find((t) => t.name === "search_financial_knowledge").annotations.readOnlyHint,
          true,
        );
        const result = await client.callTool({
          name: "search_financial_knowledge",
          arguments: { query: "¿Cómo acumulo puntos con Oro?", product: "oro" },
        });
        assert.ok(!result.isError);
        assert.ok(result.structuredContent.sources.length > 0);
        assert.ok(result.structuredContent.sources.every((s) => s.product === "oro"));
        const denied = await client.callTool({ name: "get_account_summary", arguments: {} });
        assert.equal(denied.isError, true);
      });
    const historical = await rag.search(
      knowledgeQuerySchema.parse({
        query: "¿Qué tasa tenía la promoción de 6 meses con intereses en 2024?",
        product: "clasica",
        includeHistorical: true,
      }),
    );
    assert.ok(historical.sources.some((s) => s.validity === "historical" && s.page === 5));
    const current = await rag.search(
      knowledgeQuerySchema.parse({
        query: "¿Qué tasa tiene la promoción de 6 meses con intereses?",
        product: "clasica",
      }),
    );
    assert.ok(current.sources.length > 0);
    assert.ok(current.sources.every((s) => !["historical", "future"].includes(s.validity)));
    const conversation = await call(
      "/assistant/conversations",
      "POST",
      { title: "Verificación documental" },
      auth,
      randomUUID(),
    );
    assert.equal(conversation.status, 201);
    async function turn() {
      const send = await call(
        `/assistant/conversations/${conversation.body.id}/messages`,
        "POST",
        { content: "Consulta los documentos de Platinum" },
        auth,
        randomUUID(),
      );
      assert.equal(send.status, 202);
      for (let n = 0; n < 200; n++) {
        const result = await call(`/assistant/turns/${send.body.turnId}`, "GET", undefined, auth);
        if (["completed", "failed", "interrupted"].includes(result.body.status)) {
          assert.equal(result.body.status, "completed");
          return result.body;
        }
        await new Promise((r) => setTimeout(r, 100));
      }
      throw new Error("Turn timeout");
    }
    const snapshot = await turn();
    const data = snapshot.uiSnapshot.find((m) => m.updateDataModel).updateDataModel.value;
    assert.ok(data.sources.items.length > 0);
    assert.match(snapshot.assistantMessage, /\[S1\]/);
    assert.ok(!snapshot.assistantMessage.includes("[S999]"));
    assert.ok(
      snapshot.uiSnapshot.some((m) =>
        m.updateComponents?.components.some((c) => c.component === "BanorteSources"),
      ),
    );
    const source = data.sources.items[0];
    const pdf = await call(
      `/knowledge/documents/${source.documentId}/file`,
      "GET",
      undefined,
      auth,
    );
    assert.equal(pdf.status, 200);
    assert.equal(pdf.body.subarray(0, 4).toString(), "%PDF");
    assert.equal((await call(`/knowledge/documents/${source.documentId}/file`)).status, 401);
    assert.equal(
      (await call(`/knowledge/documents/${randomUUID()}/file`, "GET", undefined, auth)).status,
      404,
    );
    modelMode = "empty";
    const empty = await turn();
    assert.match(empty.assistantMessage, /No pude verificar/);
    assert.equal(
      empty.uiSnapshot.find((m) => m.updateDataModel).updateDataModel.value.sources.items.length,
      0,
    );
    const originalSearch = rag.search.bind(rag);
    rag.search = async () => {
      throw new Error("CONTROLLED_PROVIDER_FAILURE");
    };
    modelMode = "failed";
    const failed = await turn();
    assert.match(failed.assistantMessage, /No pude verificar/);
    assert.ok(!failed.assistantMessage.includes("inventada"));
    rag.search = originalSearch;
    // Browser checks can consume this short-lived auth/snapshot inside the same test process.
    if (process.env.RAG_BROWSER_CHECK)
      await require(process.env.RAG_BROWSER_CHECK)({
        base,
        origin,
        email,
        password,
        auth,
        snapshot,
        source,
      });
    console.log(
      "OK: 6 PDFs, 94 vectores de 768 dimensiones, filtros y vigencia; MCP real con alcance; A2UI con citas, estado sin evidencia y PDFs autenticados.",
    );
  } finally {
    if (app) await app.close();
    if (userId) {
      await db.query("BEGIN");
      try {
        await db.query(
          'DELETE FROM "Account" WHERE "profileId" IN (SELECT id FROM "Profile" WHERE "userId"=$1)',
          [userId],
        );
        await db.query('DELETE FROM "Profile" WHERE "userId"=$1', [userId]);
        await db.query('DELETE FROM "User" WHERE id=$1', [userId]);
        await db.query("COMMIT");
      } catch (error) {
        await db.query("ROLLBACK");
        throw error;
      }
    }
    const after = (
      await db.query(
        'SELECT (SELECT count(*) FROM "Movement")::int AS movements, (SELECT count(*) FROM "User")::int AS users',
      )
    ).rows[0];
    assert.deepEqual(after, original);
    await db.end();
  }
})().catch((error) => {
  console.error(
    error instanceof assert.AssertionError
      ? error.message
      : "Falló la verificación RAG; revisa API local, compilación, índice y cuota de Gemini.",
  );
  process.exitCode = 1;
});
