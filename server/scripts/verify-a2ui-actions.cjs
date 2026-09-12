// Integration: authenticated HTTP -> Nest -> MCP stdio -> PostgreSQL, controlled model.
const assert = require("node:assert/strict");
const { randomUUID, randomBytes } = require("node:crypto");
const path = require("node:path");
const fs = require("node:fs");
require("reflect-metadata");
require("dotenv").config({ path: path.resolve(__dirname, "../.env"), quiet: true });
process.env.PORT = "3002";
process.env.MCP_ENTRY = path.resolve(__dirname, "../../mcp/dist/server.js");
const { NestFactory } = require("@nestjs/core");
const { AppModule } = require("../dist/app.module");
const { LlmService } = require("../dist/integrations/llm/llm.service");
const { AuthService } = require("../dist/modules/autenticacion/auth.service");
const { McpService } = require("../dist/integrations/mcp/mcp.service");
const { PrismaService } = require("../dist/database/prisma.service");
const base = "http://127.0.0.1:3002/api/v1",
  origin = "http://127.0.0.1:3000";
let app,
  db,
  auth,
  identity,
  cid,
  mode = "goals",
  modelCalls = 0;
const users = [],
  checks = [];
const data = (t) => t.uiSnapshot.find((m) => m.updateDataModel).updateDataModel.value;
async function call(url, method = "GET", body, key) {
  const r = await fetch(base + url, {
    method,
    headers: {
      Origin: origin,
      ...(auth ? { Cookie: auth.cookie, "X-CSRF-Token": auth.csrf } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, headers: r.headers, body: await r.json() };
}
async function wait(id, expected = "completed") {
  for (let n = 0; n < 250; n++) {
    const t = (await call("/assistant/turns/" + id)).body;
    if (["completed", "failed", "interrupted"].includes(t.status)) {
      assert.equal(t.status, expected, JSON.stringify(t.error));
      return t;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error("TURN_TIMEOUT");
}
async function send(content = "Consulta de evaluación") {
  const r = await call(
    `/assistant/conversations/${cid}/messages`,
    "POST",
    { content },
    randomUUID(),
  );
  assert.equal(r.status, 202);
  return wait(r.body.turnId);
}
async function post(t, event, extra = {}, key = randomUUID()) {
  return call(
    `/assistant/conversations/${cid}/actions`,
    "POST",
    { surfaceId: t.id, revision: t.revision, event, ...extra },
    key,
  );
}
async function act(t, event, extra = {}, key = randomUUID()) {
  const r = await post(t, event, extra, key);
  assert.equal(r.status, 202, JSON.stringify(r.body));
  return wait(r.body.turnId);
}
async function check(name, fn) {
  await fn();
  checks.push(name);
  console.log(`OK ${checks.length}: ${name}`);
}
async function conversation() {
  cid = (
    await call(
      "/assistant/conversations",
      "POST",
      { title: "Prueba de acciones A2UI" },
      randomUUID(),
    )
  ).body.id;
}
async function messages() {
  return (await call(`/assistant/conversations/${cid}?pageSize=100`)).body.messages.items;
}
(async () => {
  try {
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api/v1");
    db = app.get(PrismaService);
    app.get(LlmService).respond = async (history, execute) => {
      modelCalls++;
      const plan = {
        title: "Tu espacio financiero",
        explanation: "Gestiona tus objetivos y consulta tus datos.",
        blocks: ["goals"],
      };
      if (mode === "mixed") {
        await execute("get_spending_insights", { from: "2026-08-01", to: "2026-08-31" });
        return { ...plan, blocks: ["balance", "spending", "savings"] };
      }
      if (mode === "savings") return { ...plan, blocks: ["savings"] };
      if (mode === "draft")
        return {
          ...plan,
          goalDraft: {
            operation: "create",
            name: "Mi viaje",
            targetCents: 1200000,
            deadline: "2027-09-12",
          },
        };
      return plan;
    };
    await app.listen(3002, "127.0.0.1");
    const email = `a2ui-${randomUUID()}@example.test`,
      password = randomBytes(24).toString("base64url");
    const first = await app
      .get(AuthService)
      .register({ email, password, displayName: "Evaluación Maya" });
    users.push(first.user.id);
    const login = await call("/auth/login", "POST", { email, password });
    assert.equal(login.status, 200);
    auth = { cookie: login.headers.get("set-cookie").split(";")[0], csrf: login.body.csrfToken };
    identity = (await app.get(AuthService).resolve(auth.cookie.split("=")[1])).identity;
    const other = await app
      .get(AuthService)
      .register({
        email: `a2ui-${randomUUID()}@example.test`,
        password,
        displayName: "Otro perfil",
      });
    users.push(other.user.id);
    const otherProfile = await db.profile.findUniqueOrThrow({ where: { userId: other.user.id } });
    const foreign = await db.goal.create({
      data: {
        profileId: otherProfile.id,
        name: "Ajena",
        targetCents: 10000n,
        requestKey: randomUUID(),
        originalInput: {},
      },
    });
    await conversation();
    let goals, confirmation, saved, g, archived, savings, filtered;
    const change = {
      operation: "create",
      name: "Viaje",
      targetCents: 1200000,
      deadline: "2027-09-12",
    };
    await check("Catálogo y borrador de meta, sin escribir", async () => {
      assert.ok((await call("/assistant/catalog")).body.components.BanorteGoalConfirmation);
      mode = "draft";
      goals = await send("Quiero una meta para viajar");
      mode = "goals";
      assert.equal(data(goals).goals.draft.targetCents, 1200000);
      assert.equal((await call("/goals")).body.total, 0);
    });
    await check("Preparar meta solo crea confirmación", async () => {
      confirmation = await act(goals, "prepare_goal", { values: change });
      assert.equal((await call("/goals")).body.total, 0);
      assert.equal(data(confirmation).goalConfirmation.change.name, "Viaje");
    });
    await check("Confirmación no admite datos alterados ni tipo incorrecto", async () => {
      const aid = confirmation.pendingActions[0].id;
      assert.equal(
        (await post(confirmation, "confirm_goal", { actionId: aid, values: { targetCents: 1 } }))
          .status,
        400,
      );
      assert.equal((await post(confirmation, "confirm_movement", { actionId: aid })).status, 409);
    });
    await check("Crear por MCP y reintentar produce una sola meta", async () => {
      const key = randomUUID(),
        aid = confirmation.pendingActions[0].id;
      saved = await act(confirmation, "confirm_goal", { actionId: aid }, key);
      assert.equal((await act(confirmation, "confirm_goal", { actionId: aid }, key)).id, saved.id);
      await act(confirmation, "confirm_goal", { actionId: aid });
      const list = (await call("/goals")).body;
      assert.equal(list.total, 1);
      g = list.items[0];
      assert.equal(g.targetCents, 1200000);
      assert.equal((await call("/account")).body.balanceCents, 0);
    });
    await check("Cancelar edición no modifica el objetivo", async () => {
      goals = await send();
      const t = await act(goals, "prepare_goal", {
        values: {
          ...change,
          operation: "edit",
          goalId: g.id,
          expectedUpdatedAt: g.updatedAt,
          targetCents: 1500000,
        },
      });
      await act(t, "cancel_goal", { actionId: t.pendingActions[0].id });
      assert.equal((await call("/goals")).body.items[0].targetCents, 1200000);
      assert.equal(
        (await post(t, "confirm_goal", { actionId: t.pendingActions[0].id })).status,
        409,
      );
    });
    await check("Editar, archivar y recuperar requieren confirmación", async () => {
      for (const operation of ["edit", "archive", "restore"]) {
        goals = await send();
        const values = {
          operation,
          goalId: g.id,
          expectedUpdatedAt: g.updatedAt,
          ...(operation === "edit"
            ? { name: "Viaje actualizado", targetCents: 1800000, deadline: null }
            : {}),
        };
        const t = await act(goals, "prepare_goal", { values });
        saved = await act(t, "confirm_goal", { actionId: t.pendingActions[0].id });
        g = data(saved).goalResult.goal;
        assert.equal(g.status, operation === "archive" ? "archived" : "active");
        if (operation === "edit") assert.equal(g.targetCents, 1800000);
      }
    });
    await check("Lista de archivadas actualiza el mismo mensaje", async () => {
      const before = await messages();
      archived = await act(saved, "list_goals", { values: { status: "archived", page: 1 } });
      const after = await messages();
      assert.equal(after.length, before.length);
      assert.equal(
        after.find((m) => m.turnId === archived.id).id,
        before.find((m) => m.turnId === saved.id).id,
      );
      assert.equal(data(archived).goals.status, "archived");
    });
    await check(
      "Metas ajenas, versiones obsoletas y confirmaciones vencidas se rechazan",
      async () => {
        assert.equal(
          (
            await post(archived, "prepare_goal", {
              values: {
                operation: "archive",
                goalId: foreign.id,
                expectedUpdatedAt: foreign.updatedAt.getTime(),
              },
            })
          ).status,
          404,
        );
        assert.equal(
          (
            await post(archived, "prepare_goal", {
              values: { operation: "archive", goalId: g.id, expectedUpdatedAt: 0 },
            })
          ).status,
          409,
        );
        let t = await act(archived, "prepare_goal", {
          values: { operation: "archive", goalId: g.id, expectedUpdatedAt: g.updatedAt },
        });
        await db.pendingAction.update({
          where: { id: t.pendingActions[0].id },
          data: { expiresAt: new Date(0) },
        });
        assert.equal(
          (await post(t, "confirm_goal", { actionId: t.pendingActions[0].id })).status,
          410,
        );
        goals = await send();
        t = await act(goals, "prepare_goal", {
          values: { operation: "archive", goalId: g.id, expectedUpdatedAt: g.updatedAt },
        });
        await call(`/goals/${g.id}`, "PATCH", { name: "Editada desde Metas" });
        assert.equal(
          (await post(t, "confirm_goal", { actionId: t.pendingActions[0].id })).status,
          409,
        );
        assert.equal((await call("/goals")).body.items[0].status, "active");
      },
    );
    await check("Capacidad de lectura no puede escribir metas", async () => {
      await app.get(McpService).withClient(identity, ["list_goals"], undefined, async (c) => {
        assert.equal(
          (await c.callTool({ name: "apply_goal_change", arguments: {} })).isError,
          true,
        );
      });
    });
    for (let n = 0; n < 10; n++)
      await call(
        "/movements",
        "POST",
        {
          description: `Alimento ${n}`,
          amountCents: 1000,
          type: "expense",
          category: "Alimentación",
          date: "2026-08-10",
        },
        randomUUID(),
      );
    await call(
      "/movements",
      "POST",
      {
        description: "Transporte agosto",
        amountCents: 5000,
        type: "expense",
        category: "Transporte",
        date: "2026-08-15",
      },
      randomUUID(),
    );
    await call(
      "/movements",
      "POST",
      {
        description: "Alimento septiembre",
        amountCents: 2500,
        type: "expense",
        category: "Alimentación",
        date: "2026-09-01",
      },
      randomUUID(),
    );
    await conversation();
    mode = "mixed";
    let overview = await send("Mis gastos y simulador"),
      baseMessages = await messages(),
      callsBefore = modelCalls;
    await check("Seleccionar categoría filtra movimientos y conserva otros bloques", async () => {
      filtered = await act(overview, "select_category", {
        values: { category: "Alimentación", page: 1 },
      });
      assert.equal(data(filtered).movements.total, 10);
      assert.equal(data(filtered).movements.items.length, 8);
      assert.ok(
        data(filtered).movements.items.every(
          (m) => m.category === "Alimentación" && m.type === "expense",
        ),
      );
      assert.deepEqual(data(filtered).balance, data(overview).balance);
      assert.ok("savings" in data(filtered));
      assert.equal((await messages()).length, baseMessages.length);
      assert.equal(modelCalls, callsBefore);
      assert.deepEqual(
        (await call(`/assistant/turns/${overview.id}`)).body.uiSnapshot,
        overview.uiSnapshot,
      );
    });
    await check("Paginación y cambio de fechas mantienen el filtro", async () => {
      filtered = await act(filtered, "select_category", {
        values: { category: "Alimentación", page: 2 },
      });
      assert.equal(data(filtered).movements.items.length, 2);
      filtered = await act(filtered, "change_period", {
        values: { from: "2026-09-01", to: "2026-09-30" },
      });
      assert.equal(data(filtered).movements.total, 1);
      assert.equal(data(filtered).movements.items[0].amountCents, 2500);
      assert.equal(data(filtered).spending.selectedCategory, "Alimentación");
      assert.equal(data(filtered).movements.page, 1);
      assert.equal(modelCalls, callsBefore);
    });
    await check("Categorías inexistentes y superficies antiguas se rechazan", async () => {
      assert.equal(
        (await post(filtered, "select_category", { values: { category: "Compras", page: 1 } }))
          .status,
        400,
      );
      assert.equal(
        (await post(overview, "select_category", { values: { category: "Alimentación", page: 1 } }))
          .status,
        409,
      );
    });
    await check("Recalcular reemplaza respuesta, persiste y conserva gráfica", async () => {
      const values = {
        initialCents: 0,
        monthlyContributionCents: 100000,
        months: 12,
        annualRateBps: 0,
      };
      savings = await act(filtered, "simulate_savings", { values });
      assert.equal(data(savings).savings.result.finalCents, 1200000);
      savings = await act(savings, "simulate_savings", {
        values: { ...values, monthlyContributionCents: 200000 },
      });
      assert.equal(data(savings).savings.result.finalCents, 2400000);
      assert.deepEqual(data(savings).spending, data(filtered).spending);
      assert.equal((await messages()).length, baseMessages.length);
      const restored = await call(`/assistant/conversations/${cid}`);
      assert.equal(
        restored.body.messages.items.find((m) => m.role === "assistant").turnId,
        savings.id,
      );
      assert.equal(modelCalls, callsBefore);
    });
    await check("Un fallo de recálculo conserva la respuesta y permite reintentar", async () => {
      const service = app.get(McpService),
        original = service.withClient;
      let failed;
      service.withClient = async () => {
        throw Error("TEST_TOOL_UNAVAILABLE");
      };
      try {
        const r = await post(savings, "simulate_savings", {
          values: {
            initialCents: 0,
            monthlyContributionCents: 300000,
            months: 12,
            annualRateBps: 0,
          },
        });
        assert.equal(r.status, 202);
        failed = await wait(r.body.turnId, "failed");
      } finally {
        service.withClient = original;
      }
      assert.equal(failed.replacesTurnId, savings.id);
      assert.equal((await messages()).length, baseMessages.length);
      savings = await act(savings, "simulate_savings", {
        values: { initialCents: 0, monthlyContributionCents: 300000, months: 12, annualRateBps: 0 },
      });
      assert.equal(data(savings).savings.result.finalCents, 3600000);
    });
    await check("Cambiar de tema produce otra respuesta y no arrastra controles", async () => {
      mode = "goals";
      const t = await send("Quiero consultar metas");
      assert.equal(data(t).savings, undefined);
      assert.equal(data(t).spending, undefined);
      assert.equal(
        (
          await post(savings, "simulate_savings", {
            values: { initialCents: 0, monthlyContributionCents: 100, months: 1, annualRateBps: 0 },
          })
        ).status,
        409,
      );
    });
    if (process.env.A2UI_HANDOFF_FILE) {
      await conversation();
      mode = "mixed";
      await send("Mis gastos y mi ahorro");
      await db.conversation.update({
        where: { id: cid },
        data: { title: "Gráfica y simulador interactivos" },
      });
      fs.writeFileSync(
        process.env.A2UI_HANDOFF_FILE,
        JSON.stringify({ email, password, conversationId: cid }),
        { mode: 0o600 },
      );
      console.log("Esperando verificación visual (.done), máximo 10 minutos.");
      for (let n = 0; n < 600 && !fs.existsSync(process.env.A2UI_HANDOFF_FILE + ".done"); n++)
        await new Promise((r) => setTimeout(r, 1000));
      fs.rmSync(process.env.A2UI_HANDOFF_FILE, { force: true });
    }
    console.log(JSON.stringify({ passed: checks.length, checks }));
  } finally {
    if (db)
      for (const userId of users) {
        const profile = await db.profile.findUnique({ where: { userId } });
        if (profile) {
          await db.movement.deleteMany({ where: { account: { profileId: profile.id } } });
          await db.account.deleteMany({ where: { profileId: profile.id } });
          await db.profile.delete({ where: { id: profile.id } });
        }
        await db.user.delete({ where: { id: userId } });
      }
    if (app) await app.close();
  }
})().catch((e) => {
  console.error(
    e instanceof assert.AssertionError
      ? e.message
      : `Falló la prueba A2UI: ${e.name} ${e.code ?? ""} ${(e.stack ?? "").split("\n").slice(1, 4).join(" ")}`,
  );
  process.exitCode = 1;
});
