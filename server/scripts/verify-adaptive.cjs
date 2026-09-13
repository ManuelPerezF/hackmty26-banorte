// Real Nest/MCP/PostgreSQL with controlled model, disposable user and no external provider calls.
const assert = require("node:assert/strict"),
  { randomUUID, randomBytes } = require("node:crypto"),
  { createRequire } = require("node:module"),
  path = require("node:path"),
  fs = require("node:fs");
const req = createRequire(path.resolve(__dirname, "../package.json"));
req("reflect-metadata");
req("dotenv").config({ path: path.resolve(__dirname, "../.env"), quiet: true });
process.env.PORT = "3002";
process.env.MCP_ENTRY = path.resolve(__dirname, "../../mcp/dist/server.js");
const { NestFactory } = req("@nestjs/core"),
  { AppModule } = req("./dist/app.module"),
  { LlmService } = req("./dist/integrations/llm/llm.service"),
  { AuthService } = req("./dist/modules/autenticacion/auth.service"),
  { KnowledgeService } = req("./dist/modules/conocimiento/knowledge.service"),
  { McpService } = req("./dist/integrations/mcp/mcp.service"),
  { toolCacheKey } = req("./dist/modules/asistente/conversation-context"),
  { comparePeriods } = req("./dist/modules/analisis/comparison"),
  { Client } = req("pg");
const db = new Client({ connectionString: process.env.DATABASE_URL }),
  base = "http://127.0.0.1:3002/api/v1",
  origin = "http://127.0.0.1:3000",
  checks = [];
let app,
  userId,
  identity,
  auth,
  cid,
  cardId,
  mode = "draft";
const data = (t) => t.uiSnapshot.find((m) => m.updateDataModel).updateDataModel.value;
async function check(name, fn) {
  const start = Date.now();
  await fn();
  checks.push({ name, ms: Date.now() - start });
  console.log(`OK ${checks.length}: ${name} (${Date.now() - start} ms)`);
}
async function call(url, method = "GET", body, key) {
  const r = await fetch(base + url, {
    method,
    headers: {
      Origin: origin,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(auth ? { Cookie: auth.cookie, "X-CSRF-Token": auth.csrf } : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, headers: r.headers, body: await r.json() };
}
async function wait(id) {
  for (let n = 0; n < 200; n++) {
    const t = (await call(`/assistant/turns/${id}`)).body;
    if (["completed", "failed", "interrupted"].includes(t.status)) {
      assert.equal(t.status, "completed");
      return t;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error("TURN_TIMEOUT");
}
async function send(content = "Pregunta de evaluación") {
  const r = await call(
    `/assistant/conversations/${cid}/messages`,
    "POST",
    { content },
    randomUUID(),
  );
  assert.equal(r.status, 202);
  return wait(r.body.turnId);
}
async function action(t, event, extra, key = randomUUID()) {
  const r = await call(
    `/assistant/conversations/${cid}/actions`,
    "POST",
    { surfaceId: t.id, revision: t.revision, event, ...extra },
    key,
  );
  assert.equal(r.status, 202);
  return wait(r.body.turnId);
}
const { documentQuote } = req("./dist/modules/conocimiento/document-quote");
assert.equal(
  documentQuote("Puntos  por cada\ncompra registrada.", "Puntos por cada compra registrada."),
  "Puntos  por cada\ncompra registrada.",
);
assert.equal(
  documentQuote("Puntos por cada compra registrada.", "Puntos por compras ilimitadas gratis."),
  null,
);
const first = { from: "2026-08-01", to: "2026-08-31" },
  second = { from: "2026-09-01", to: "2026-09-30" };
(async () => {
  await db.connect();
  const count = async () =>
      (
        await db.query(
          'SELECT (SELECT count(*) FROM "Movement")::int movements,(SELECT count(*) FROM "User")::int users',
        )
      ).rows[0],
    before = await count();
  try {
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api/v1");
    app.enableCors({
      origin,
      credentials: true,
      allowedHeaders: ["Content-Type", "X-CSRF-Token", "Idempotency-Key"],
    });
    app.get(LlmService).respond = async (history, execute) => {
      const plan = {
        title: "Evaluación Maya",
        explanation: "Resultado de evaluación controlada.",
        blocks: ["education"],
      };
      if (mode === "draft" || mode === "foreign") {
        await execute("list_my_cards", {});
        return {
          ...plan,
          title: "Revisa tu gasto",
          blocks: ["movementForm"],
          movementDraft: {
            cardId: mode === "draft" ? cardId : randomUUID(),
            description: "Supermercado",
            amountCents: 25000,
            type: "expense",
            category: "Alimentación",
            date: "2026-09-01",
          },
        };
      }
      if (mode === "comparison") {
        await execute("compare_spending_periods", { first, second });
        return { ...plan, blocks: ["comparison"] };
      }
      if (mode === "cache") {
        const a = await execute("get_spending_insights", first),
          b = await execute("get_spending_insights", second),
          again = await execute("get_spending_insights", first);
        assert.equal(a.totals.expenseCents, 10000);
        assert.equal(b.totals.expenseCents, 25000);
        assert.deepEqual(a, again);
        return { ...plan, blocks: ["spending"] };
      }
      if (mode === "savings") return { ...plan, blocks: ["savings"] };
      if (mode === "double") {
        assert.ok(
          history.some(
            (m) =>
              m.content.startsWith("Contexto de la aplicación") &&
              m.content.includes('"monthlyContributionCents":50000'),
          ),
        );
        await execute("simulate_savings", {
          initialCents: 100000,
          monthlyContributionCents: 100000,
          months: 12,
          annualRateBps: 0,
        });
        return { ...plan, blocks: ["savings"] };
      }
      if (mode === "knowledge") {
        const r = await execute("search_financial_knowledge", {
            query: "beneficios oro",
            product: "oro",
          }),
          s = r.sources[0];
        return {
          ...plan,
          explanation: `Consulta [${s.citation}].`,
          knowledgeQuotes: [
            { citation: s.citation, quote: s.excerpt.slice(0, 180) },
            { citation: s.citation, quote: "Beneficio inventado sin respaldo documental." },
          ],
        };
      }
      if (mode === "isolated")
        assert.ok(
          !history
            .find((m) => m.content.startsWith("Contexto de la aplicación"))
            .content.includes("monthlyContributionCents"),
        );
      return plan;
    };
    await app.listen(3002, "127.0.0.1");
    const email = `adaptive-${randomUUID()}@example.test`,
      password = randomBytes(24).toString("base64url");
    userId = (
      await app.get(AuthService).register({ email, password, displayName: "Evaluación Maya" })
    ).user.id;
    const login = await call("/auth/login", "POST", { email, password });
    assert.equal(login.status, 200);
    auth = { cookie: login.headers.get("set-cookie").split(";")[0], csrf: login.body.csrfToken };
    identity = (await app.get(AuthService).resolve(auth.cookie.split("=")[1])).identity;
    cardId = randomUUID();
    await db.query('INSERT INTO "Card" (id,"profileId","productKey",last4) VALUES ($1,$2,$3,$4)', [
      cardId,
      identity.profileId,
      "oro",
      "1234",
    ]);
    cid = (
      await call(
        "/assistant/conversations",
        "POST",
        { title: "Evaluación adaptativa" },
        randomUUID(),
      )
    ).body.id;
    let draft, confirmation, receipt, comparison, savings, knowledge;
    const payload = {
      cardId,
      description: "Supermercado",
      amountCents: 25000,
      type: "expense",
      category: "Alimentación",
      date: "2026-09-01",
    };
    await check("Catálogo anuncia nuevos bloques", async () => {
      const c = (await call("/assistant/catalog")).body;
      for (const n of ["BanorteSources", "BanortePeriodComparison", "BanorteKnowledgeFacts"])
        assert.ok(c.components[n]);
    });
    await check("Borrador de monto y tarjeta propios sin escritura", async () => {
      draft = await send("Registra $250 de supermercado con mi Oro");
      assert.equal(data(draft).form.draft.amountCents, 25000);
      assert.equal(data(draft).form.draft.cardId, cardId);
      assert.equal((await call("/account")).body.balanceCents, 0);
    });
    await check("Rechaza tarjeta ajena en borrador", async () => {
      mode = "foreign";
      assert.equal(data(await send()).form.draft.cardId, undefined);
      mode = "draft";
      draft = await send();
    });
    await check("Preparación no cambia saldo", async () => {
      confirmation = await action(draft, "submit_movement_form", { values: payload });
      assert.equal((await call("/account")).body.balanceCents, 0);
    });
    const confirmationKey = randomUUID();
    let aid;
    await check("Confirmar produce una escritura", async () => {
      mode = "receipt";
      aid = confirmation.pendingActions[0].id;
      receipt = await action(confirmation, "confirm_movement", { actionId: aid }, confirmationKey);
      assert.equal((await call("/account")).body.balanceCents, -25000);
    });
    await check("Reintento idempotente", async () => {
      assert.equal(
        (await action(confirmation, "confirm_movement", { actionId: aid }, confirmationKey)).id,
        receipt.id,
      );
      assert.equal((await call("/movements")).body.total, 1);
    });
    await check("Recuperación del recibo", async () => {
      assert.deepEqual(
        (await call(`/assistant/turns/${receipt.id}`)).body.uiSnapshot,
        receipt.uiSnapshot,
      );
    });
    await call(
      "/movements",
      "POST",
      { ...payload, date: "2026-08-01", amountCents: 10000, description: "Gasto agosto" },
      randomUUID(),
    );
    await check("Dos periodos con diferencia exacta", async () => {
      mode = "comparison";
      comparison = await send("Compara agosto y septiembre de 2026");
      const c = data(comparison).comparison;
      assert.equal(c.first.expenseCents, 10000);
      assert.equal(c.second.expenseCents, 25000);
      assert.equal(c.deltaCents, 15000);
      assert.equal(c.changePercent, 150);
    });
    await check("Base cero y distinta duración", async () => {
      const t = { incomeCents: 0, expenseCents: 0, netCents: 0, movementCount: 0 },
        c = comparePeriods(
          { period: first, totals: t },
          { period: second, totals: { ...t, expenseCents: 100 } },
        );
      assert.equal(c.changePercent, null);
      assert.equal(c.differentDurations, true);
    });
    await check("Caché conserva argumentos distintos", async () => {
      assert.notEqual(toolCacheKey("x", first), toolCacheKey("x", second));
      mode = "cache";
      assert.equal(data(await send()).spending.totals.expenseCents, 10000);
    });
    await check("Recálculo determinista de simulador", async () => {
      mode = "savings";
      const t = await send();
      savings = await action(t, "simulate_savings", {
        values: {
          initialCents: 100000,
          monthlyContributionCents: 50000,
          months: 12,
          annualRateBps: 0,
        },
      });
      assert.equal(data(savings).savings.result.finalCents, 700000);
    });
    await check("Continuidad: aportar el doble", async () => {
      mode = "double";
      const t = await send("¿Y si aporto el doble?");
      assert.equal(data(t).savings.result.finalCents, 1300000);
      assert.equal(data(t).savings.result.assumptions.months, 12);
    });
    await check("Extractos exactos y rechazo de citas inventadas", async () => {
      const row = (
        await db.query(
          'SELECT c.id,d.id AS "documentId",d.title,d.product,c.page,c.text AS excerpt,c."validFrom"::text,c."validTo"::text FROM "KnowledgeChunk" c JOIN "KnowledgeDocument" d ON d.id=c."documentId" WHERE d.slug=$1 ORDER BY c.page,c.ordinal LIMIT 1',
          ["oro-folleto"],
        )
      ).rows[0];
      app.get(KnowledgeService).search = async () => ({
        sources: [{ ...row, validity: "dated", similarity: 0.9 }],
        message: "Fuente pública",
      });
      mode = "knowledge";
      knowledge = await send("Beneficios de Oro");
      assert.equal(data(knowledge).knowledgeFacts.items.length, 1);
    });
    await check("Capacidad MCP de solo lectura", async () => {
      await app
        .get(McpService)
        .withClient(identity, ["compare_spending_periods"], undefined, async (c) => {
          // Derivado del catálogo: agregar una herramienta no debe romper la
          // prueba, pero sí debe seguir siendo imposible escribir sin capacidad.
          assert.equal(
            (await c.listTools()).tools.length,
            Object.keys(req("./dist/integrations/mcp/tool-definitions").toolDefinitions).length,
          );
          assert.equal(
            (await c.callTool({ name: "register_movement", arguments: {} })).isError,
            true,
          );
          assert.equal(
            (await c.callTool({ name: "contribute_to_goal", arguments: {} })).isError,
            true,
            "una capacidad de lectura tampoco puede aportar a metas",
          );
        });
    });
    const originalCid = cid;
    await check("Aislamiento entre conversaciones", async () => {
      cid = (
        await call(
          "/assistant/conversations",
          "POST",
          { title: "Sin contexto anterior" },
          randomUUID(),
        )
      ).body.id;
      mode = "isolated";
      await send();
    });
    if (process.env.ADAPTIVE_HANDOFF_FILE) {
      fs.writeFileSync(
        process.env.ADAPTIVE_HANDOFF_FILE,
        JSON.stringify({
          email,
          password,
          snapshots: { draft, comparison, savings, knowledge },
          conversationId: originalCid,
        }),
        { mode: 0o600 },
      );
      console.log("Esperando verificación visual (.done), máximo 10 minutos.");
      for (let n = 0; n < 600 && !fs.existsSync(process.env.ADAPTIVE_HANDOFF_FILE + ".done"); n++)
        await new Promise((r) => setTimeout(r, 1000));
      fs.rmSync(process.env.ADAPTIVE_HANDOFF_FILE, { force: true });
    }
    console.log(JSON.stringify({ passed: checks.length, checks }));
  } finally {
    if (app) await app.close();
    if (userId) {
      await db.query("BEGIN");
      try {
        await db.query(
          'DELETE FROM "Movement" WHERE "accountId" IN (SELECT id FROM "Account" WHERE "profileId"=$1)',
          [identity.profileId],
        );
        await db.query('DELETE FROM "Account" WHERE "profileId"=$1', [identity.profileId]);
        await db.query('DELETE FROM "Profile" WHERE "userId"=$1', [userId]);
        await db.query('DELETE FROM "User" WHERE id=$1', [userId]);
        await db.query("COMMIT");
      } catch (e) {
        await db.query("ROLLBACK");
        throw e;
      }
    }
    assert.deepEqual(await count(), before);
    await db.end();
  }
})().catch((e) => {
  console.error(
    e instanceof assert.AssertionError
      ? e.message
      : "Falló la evaluación adaptativa; revisa build, servicios e índice.",
  );
  process.exitCode = 1;
});
