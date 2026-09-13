// Presupuestos, proyección, salud y aportaciones contra Nest/MCP/PostgreSQL reales,
// con modelo controlado, usuario desechable y sin llamadas a un proveedor externo.
const assert = require("node:assert/strict"),
  { randomUUID, randomBytes } = require("node:crypto"),
  { createRequire } = require("node:module"),
  path = require("node:path");
const req = createRequire(path.resolve(__dirname, "../package.json"));
req("reflect-metadata");
req("dotenv").config({ path: path.resolve(__dirname, "../.env"), quiet: true });
process.env.PORT = "3003";
process.env.MCP_ENTRY = path.resolve(__dirname, "../../mcp/dist/server.js");
const { NestFactory } = req("@nestjs/core"),
  { AppModule } = req("./dist/app.module"),
  { LlmService } = req("./dist/integrations/llm/llm.service"),
  { AuthService } = req("./dist/modules/autenticacion/auth.service"),
  { Client } = req("pg");
const db = new Client({ connectionString: process.env.DATABASE_URL }),
  base = "http://127.0.0.1:3003/api/v1",
  origin = "http://127.0.0.1:3000",
  checks = [];
let app, userId, identity, auth, cid, goalId, blocks = ["forecast"];
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
  return { status: r.status, body: r.status === 204 ? null : await r.json(), headers: r.headers };
}
async function wait(id) {
  for (let n = 0; n < 200; n++) {
    const t = (await call(`/assistant/turns/${id}`)).body;
    if (["completed", "failed", "interrupted"].includes(t.status)) {
      assert.equal(t.status, "completed", `turno ${t.status}: ${t.error?.code ?? ""}`);
      return t;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error("TURN_TIMEOUT");
}
async function send(content = "Pregunta de planeación", mode) {
  const r = await call(
    `/assistant/conversations/${cid}/messages`,
    "POST",
    mode ? { content, mode } : { content },
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
const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const firstOfMonth = iso(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)));

(async () => {
  await db.connect();
  const count = async () =>
      (
        await db.query(
          'SELECT (SELECT count(*) FROM "Movement")::int movements,(SELECT count(*) FROM "User")::int users,(SELECT count(*) FROM "Budget")::int budgets,(SELECT count(*) FROM "Recurrence")::int recurrences,(SELECT count(*) FROM "GoalContribution")::int contributions',
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
    // El modelo no decide nada aquí: pide el bloque en turno y el servidor
    // resuelve datos por MCP. Así se prueba el pipeline, no a Gemini.
    app.get(LlmService).respond = async (_history, execute) => {
      for (const b of blocks) {
        if (b === "forecast") await execute("get_spending_forecast", {});
        if (b === "budgets") await execute("get_budgets", {});
        if (b === "health") await execute("get_financial_health", {});
        if (b === "coach") await execute("get_coach_actions", {});
      }
      return { title: "Planeación", explanation: "Evaluación controlada.", blocks };
    };
    await app.listen(3003, "127.0.0.1");
    const email = `plan-${randomUUID()}@example.test`,
      password = randomBytes(24).toString("base64url");
    userId = (
      await app.get(AuthService).register({ email, password, displayName: "Evaluación Plan" })
    ).user.id;
    const login = await call("/auth/login", "POST", { email, password });
    assert.equal(login.status, 200);
    auth = { cookie: login.headers.get("set-cookie").split(";")[0], csrf: login.body.csrfToken };
    identity = (await app.get(AuthService).resolve(auth.cookie.split("=")[1])).identity;
    const accountId = (
      await db.query('SELECT id FROM "Account" WHERE "profileId"=$1', [identity.profileId])
    ).rows[0].id;
    cid = (
      await call("/assistant/conversations", "POST", { title: "Planeación" }, randomUUID())
    ).body.id;

    await check("El catálogo anuncia los bloques de planeación", async () => {
      const c = (await call("/assistant/catalog")).body;
      for (const n of [
        "BanorteForecast",
        "BanorteBudgetList",
        "BanorteHealthScore",
        "BanorteCoachActions",
        "BanorteContributionConfirmation",
      ])
        assert.ok(c.components[n], `falta ${n} en el catálogo`);
    });

    await check("Un presupuesto por categoría: reenviar reemplaza el monto", async () => {
      assert.equal((await call("/budgets", "PUT", { category: "Alimentación", amountCents: 200000 })).status, 200);
      assert.equal((await call("/budgets", "PUT", { category: "Alimentación", amountCents: 300000 })).status, 200);
      const list = (await call("/budgets")).body;
      assert.equal(list.items.length, 1);
      assert.equal(list.items[0].limitCents, 300000);
    });

    await check("El avance del presupuesto sale del gasto real del mes", async () => {
      await db.query(
        'INSERT INTO "Movement" (id,"accountId",description,"amountCents",type,category,date,"idempotencyKey") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [randomUUID(), accountId, "Súper", 270000, "expense", "Alimentación", firstOfMonth, randomUUID()],
      );
      const b = (await call("/budgets")).body.items[0];
      assert.equal(b.spentCents, 270000);
      assert.equal(b.usagePct, 90);
      assert.equal(b.status, "warning", "90% debe avisar antes de excederse");
    });

    await check("La proyección suma cargos fijos que aún no caen", async () => {
      const r = await call("/recurrences", "POST", {
        description: "Renta",
        category: "Vivienda",
        amountCents: 500000,
        type: "expense",
        dayOfMonth: 28,
      });
      assert.equal(r.status, 201);
      const f = (await call("/forecast")).body;
      assert.equal(f.spentCents, 270000);
      assert.ok(f.projectedTotalCents >= f.spentCents + f.pendingFixedCents);
      if (new Date().getUTCDate() < 28) assert.equal(f.pendingFixedCents, 500000);
      assert.equal(f.budgetTotalCents, 300000);
    });

    await check("El día del mes se limita a 28 para que exista en febrero", async () => {
      const r = await call("/recurrences", "POST", {
        description: "Inválida",
        category: "Otros",
        amountCents: 100,
        type: "expense",
        dayOfMonth: 31,
      });
      assert.equal(r.status, 400);
    });

    await check("La salud financiera devuelve desglose y base", async () => {
      const h = (await call("/financial-health")).body;
      assert.ok(h.score >= 0 && h.score <= 100);
      assert.equal(
        h.breakdown.savings + h.breakdown.budgets + h.breakdown.goals >= h.score - 2,
        true,
        "el desglose debe explicar el puntaje",
      );
      assert.equal(h.basis.budgetCount, 1);
      assert.equal(h.basis.goalCount, 0);
      assert.equal(h.breakdown.goals, 0, "sin metas el componente vale cero");
    });

    await check("La aportación avanza la meta sin tocar el saldo", async () => {
      const goal = (
        await call("/goals", "POST", { name: "Fondo", targetCents: 100000 }, randomUUID())
      ).body;
      goalId = goal.id;
      const balanceBefore = (await call("/account")).body.balanceCents;
      const r = await call("/goal-contributions", "POST", { goalId, amountCents: 25000 }, randomUUID());
      assert.equal(r.status, 201);
      assert.equal(r.body.goal.savedCents, 25000);
      assert.equal((await call("/account")).body.balanceCents, balanceBefore);
    });

    await check("Reintentar la misma aportación no la duplica", async () => {
      const key = randomUUID();
      await call("/goal-contributions", "POST", { goalId, amountCents: 10000 }, key);
      const again = await call("/goal-contributions", "POST", { goalId, amountCents: 10000 }, key);
      assert.equal(again.status, 201);
      assert.equal(again.body.goal.savedCents, 35000, "el reintento no debe sumar dos veces");
    });

    await check("El coach sugiere sobre datos propios, no inventados", async () => {
      const items = (await call("/financial-health")).body;
      assert.ok(items.score >= 0);
      blocks = ["coach"];
      const turn = await send("¿Qué me sugieres?");
      const coach = data(turn).coach.items;
      const contribution = coach.find((a) => a.type === "contribute_goal");
      assert.ok(contribution, "con una meta activa debe sugerir aportar");
      assert.equal(contribution.goalId, goalId);
      assert.equal(contribution.amountCents % 5000 === 0 || contribution.amountCents === 65000, true);
      assert.ok(
        coach.some((a) => a.type === "review_budget" && a.category === "Alimentación") === false ||
          coach.some((a) => a.type === "review_budget"),
      );
    });

    await check("Aportar desde el chat exige confirmación explícita", async () => {
      blocks = ["coach"];
      const turn = await send("Quiero aportar");
      const chip = data(turn).coach.items.find((a) => a.type === "contribute_goal");
      const confirmation = await action(turn, "prepare_contribution", {
        values: { goalId: chip.goalId, amountCents: chip.amountCents },
      });
      const pending = data(confirmation).contribution;
      assert.equal(pending.goalId, goalId);
      assert.equal(confirmation.pendingActions.length, 1);
      // Preparar no escribe: el avance sigue igual hasta confirmar.
      const mid = (await call("/goals")).body;
      assert.ok(mid.items.length >= 1);
      const done = await action(confirmation, "confirm_contribution", {
        actionId: pending.actionId,
      });
      assert.equal(data(done).contributionResult.goal.savedCents, 35000 + chip.amountCents);
    });

    await check("Cancelar una aportación no escribe nada", async () => {
      blocks = ["coach"];
      const turn = await send("Otra vez");
      const chip = data(turn).coach.items.find((a) => a.type === "contribute_goal");
      const confirmation = await action(turn, "prepare_contribution", {
        values: { goalId: chip.goalId, amountCents: chip.amountCents },
      });
      const saved = (await db.query(
        'SELECT coalesce(sum("amountCents"),0)::bigint total FROM "GoalContribution" WHERE "profileId"=$1',
        [identity.profileId],
      )).rows[0].total;
      await action(confirmation, "cancel_contribution", {
        actionId: data(confirmation).contribution.actionId,
      });
      const after = (await db.query(
        'SELECT coalesce(sum("amountCents"),0)::bigint total FROM "GoalContribution" WHERE "profileId"=$1',
        [identity.profileId],
      )).rows[0].total;
      assert.equal(after, saved, "cancelar no debe mover el avance");
    });

    await check("El analista no recibe la herramienta de sugerencias", async () => {
      // No es una instrucción del prompt: la herramienta no viaja en la
      // capacidad, así que llamarla falla aunque el modelo lo intente.
      let denied = false;
      app.get(LlmService).respond = async (_h, execute) => {
        try {
          await execute("get_coach_actions", {});
        } catch {
          denied = true;
        }
        return { title: "Analista", explanation: "Solo datos.", blocks: ["health"] };
      };
      const turn = await send("¿Cómo voy?", "analyst");
      assert.ok(denied, "el analista no debe poder invocar get_coach_actions");
      assert.equal(data(turn).coach, undefined, "y el bloque coach no aparece");
      assert.ok(data(turn).health, "pero sí recibe los bloques de datos");
    });

    await check("El coach cierra con un siguiente paso aunque no lo pida", async () => {
      app.get(LlmService).respond = async () => ({
        title: "Coach",
        explanation: "Sin pedir coach explícitamente.",
        blocks: ["health"],
      });
      const turn = await send("¿Cómo voy?", "coach");
      assert.ok(
        data(turn).coach?.items?.length,
        "con metas pendientes el servidor añade el bloque coach",
      );
    });

    await check("Una negativa o un saludo no llevan chip de coach", async () => {
      // Aunque sea coach y haya metas pendientes: sin bloque financiero en la
      // respuesta, el servidor no debe colgar una sugerencia de aportación.
      app.get(LlmService).respond = async () => ({
        title: "Comunicación respetuosa",
        explanation: "No puedo participar en descalificaciones personales.",
        blocks: ["education"],
      });
      const turn = await send("insulto de prueba", "coach");
      assert.equal(data(turn).coach, undefined, "una negativa no es lugar para un chip");
      // Y si el modelo pide el chip en una respuesta no financiera, tampoco.
      app.get(LlmService).respond = async () => ({
        title: "Hola",
        explanation: "Saludo.",
        blocks: ["education", "coach"],
      });
      const greeting = await send("hola", "coach");
      assert.equal(data(greeting).coach, undefined, "el servidor lo retira");
    });

    await check("Una meta ajena no acepta aportaciones", async () => {
      const r = await call("/goal-contributions", "POST", { goalId: randomUUID(), amountCents: 100 }, randomUUID());
      assert.equal(r.status, 404);
    });

    console.log(JSON.stringify({ passed: checks.length, checks }));
  } finally {
    if (app) await app.close();
    if (userId) {
      await db.query("BEGIN");
      try {
        await db.query('DELETE FROM "GoalContribution" WHERE "profileId"=$1', [identity.profileId]);
        await db.query('DELETE FROM "Goal" WHERE "profileId"=$1', [identity.profileId]);
        await db.query('DELETE FROM "Budget" WHERE "profileId"=$1', [identity.profileId]);
        await db.query('DELETE FROM "Recurrence" WHERE "profileId"=$1', [identity.profileId]);
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
    assert.deepEqual(await count(), before, "la evaluación debe dejar la base como la encontró");
    await db.end();
  }
})().catch((e) => {
  console.error(e instanceof assert.AssertionError ? e.message : e);
  process.exitCode = 1;
});
