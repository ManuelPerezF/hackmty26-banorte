import {
  BadRequestException,
  ConflictException,
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { Prisma } from "../../generated/prisma/client";
import { Identity } from "../autenticacion/auth.types";
import { AuthService } from "../autenticacion/auth.service";
import { McpService } from "../../integrations/mcp/mcp.service";
import { LlmService } from "../../integrations/llm/llm.service";
import { ToolName, toolDefinitions } from "../../integrations/mcp/tool-definitions";
import { surface, a2uiMessageSchema } from "../../ui-protocol/a2ui";
import { sameJson } from "../../shared/requests";
import { ENV, Environment } from "../../config/env";
import { AgentAction, turnInputSchema } from "./asistente.schemas";
import {
  movementSchema,
  todayInTimezone,
  categories,
} from "../movimientos/schemas/movimiento.schema";
import { insightsSchema } from "../analisis/analisis.module";
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const agentErrors: Record<string, string> = {
  LLM_QUOTA_EXCEEDED:
    "El asistente alcanzó su límite de uso. Intenta más tarde; puedes seguir usando tus cuentas y movimientos.",
  LLM_UNAVAILABLE:
    "El servicio de IA está ocupado temporalmente. Intenta de nuevo en unos momentos.",
  LLM_AUTH_FAILED:
    "El asistente no puede conectarse al servicio de IA. La configuración de acceso requiere revisión.",
  LLM_TIMEOUT:
    "El asistente tardó demasiado en responder. Consulta el estado de tu movimiento antes de reintentar.",
};
const terminal = (s: string) => ["completed", "failed", "interrupted"].includes(s);
@Injectable()
export class AsistenteService implements OnModuleInit {
  constructor(
    private readonly db: PrismaService,
    private readonly auth: AuthService,
    private readonly mcp: McpService,
    private readonly llm: LlmService,
    @Inject(ENV) private readonly env: Environment,
  ) {}
  async onModuleInit() {
    await this.db.agentTurn.updateMany({
      where: { status: { in: ["queued", "running"] } },
      data: { status: "interrupted", errorCode: "TURN_INTERRUPTED" },
    });
  }
  private async conversation(i: Identity, id: string) {
    const c = await this.db.conversation.findFirst({ where: { id, profileId: i.profileId } });
    if (!c) throw new NotFoundException();
    return c;
  }
  async create(i: Identity, title: string, requestKey: string) {
    const input = { title };
    try {
      const c = await this.db.conversation.create({
        data: { profileId: i.profileId, title, requestKey, originalInput: input },
      });
      return { id: c.id, title: c.title, createdAt: c.createdAt.getTime() };
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") throw e;
      const c = await this.db.conversation.findUniqueOrThrow({
        where: { profileId_requestKey: { profileId: i.profileId, requestKey } },
      });
      if (!sameJson(c.originalInput, input)) throw new ConflictException("Clave reutilizada.");
      return { id: c.id, title: c.title, createdAt: c.createdAt.getTime() };
    }
  }
  async list(i: Identity, q: { page: number; pageSize: number }) {
    const where = { profileId: i.profileId };
    const [items, total] = await this.db.$transaction([
      this.db.conversation.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        select: { id: true, title: true, createdAt: true, updatedAt: true },
      }),
      this.db.conversation.count({ where }),
    ]);
    return {
      items: items.map((c) => ({
        ...c,
        createdAt: c.createdAt.getTime(),
        updatedAt: c.updatedAt.getTime(),
      })),
      total,
      ...q,
    };
  }
  async detail(i: Identity, id: string, q: { page: number; pageSize: number }) {
    const c = await this.conversation(i, id);
    const [items, total, latest] = await this.db.$transaction([
      this.db.message.findMany({
        where: { conversationId: id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.db.message.count({ where: { conversationId: id } }),
      this.db.agentTurn.findFirst({
        where: { conversationId: id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { id: true },
      }),
    ]);
    return {
      id: c.id,
      title: c.title,
      createdAt: c.createdAt.getTime(),
      updatedAt: c.updatedAt.getTime(),
      messages: {
        items: items.map(({ conversationId, ...m }) => ({
          ...m,
          createdAt: m.createdAt.getTime(),
        })),
        total,
        ...q,
      },
      latestTurnId: latest?.id ?? null,
    };
  }
  private receipt(turn: { id: string; conversationId: string; status: string }) {
    return {
      conversationId: turn.conversationId,
      turnId: turn.id,
      status: turn.status,
      eventsUrl: `/api/v1/assistant/turns/${turn.id}/events`,
    };
  }
  async send(i: Identity, id: string, content: string, requestKey: string) {
    await this.conversation(i, id);
    this.llm.assertConfigured();
    return this.enqueue(i, id, { kind: "message", content }, requestKey);
  }
  async action(i: Identity, id: string, action: AgentAction, requestKey: string) {
    await this.conversation(i, id);
    if (action.event === "submit_movement_form" && action.values.date > todayInTimezone(i.timezone))
      throw new BadRequestException("La fecha no puede ser posterior a hoy.");
    const previous = await this.db.agentTurn.findUnique({
      where: { conversationId_requestKey: { conversationId: id, requestKey } },
    });
    if (previous) {
      if (!sameJson(previous.input, { kind: "action", ...action })) throw new ConflictException();
      return this.receipt(previous);
    }
    const origin = await this.db.agentTurn.findFirst({
      where: { id: action.surfaceId, conversationId: id },
    });
    if (!origin || origin.revision !== action.revision || !origin.uiSnapshot)
      throw new ConflictException({ code: "STALE_UI", message: "Actualiza la interfaz." });
    const messages = (origin.uiSnapshot as unknown[]).map((m) => a2uiMessageSchema.parse(m));
    const components = messages.flatMap((m) =>
      "updateComponents" in m ? m.updateComponents.components : [],
    );
    if (
      action.event === "submit_movement_form" &&
      !components.some((c) => c.component === "BanorteMovementForm")
    )
      throw new ConflictException("Formulario no disponible.");
    if (
      action.event === "simulate_savings" &&
      !components.some((c) => c.component === "BanorteSavingsSimulator")
    )
      throw new ConflictException("Simulador no disponible.");
    if (action.event === "change_period") {
      insightsSchema.parse(action.values);
      if (!components.some((c) => c.component === "BanortePeriodSelector"))
        throw new ConflictException("Selector no disponible.");
    }
    if ("actionId" in action) {
      const pending = await this.db.pendingAction.findFirst({
        where: { id: action.actionId, turnId: origin.id, sessionId: i.sessionId },
      });
      if (!pending) throw new NotFoundException();
      if (pending.status === "pending" && pending.expiresAt.getTime() < Date.now())
        throw new GoneException("La acción expiró.");
      if (action.event === "cancel_movement" && pending.status !== "pending")
        throw new ConflictException("La acción ya inició o terminó.");
      if (action.event === "confirm_movement" && pending.status === "cancelled")
        throw new ConflictException("Acción cancelada.");
    }
    const latest = await this.db.agentTurn.findFirst({
      where: { conversationId: id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    if (latest?.id !== origin.id && !("actionId" in action))
      throw new ConflictException({ code: "STALE_UI", message: "Actualiza la interfaz." });
    return this.enqueue(i, id, { kind: "action", ...action }, requestKey);
  }
  private async enqueue(
    i: Identity,
    conversationId: string,
    input: Record<string, unknown>,
    requestKey: string,
  ) {
    try {
      const turn = await this.db.$transaction(async (tx) => {
        const t = await tx.agentTurn.create({
          data: { conversationId, sessionId: i.sessionId, requestKey, input: json(input) },
        });
        if (input.kind === "message")
          await tx.message.create({
            data: { conversationId, role: "user", content: String(input.content), turnId: t.id },
          });
        await tx.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
        return t;
      });
      setImmediate(() => {
        void this.run(turn.id, i).catch(() => {});
      });
      return this.receipt(turn);
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") throw e;
      const old = await this.db.agentTurn.findUnique({
        where: { conversationId_requestKey: { conversationId, requestKey } },
      });
      if (old && sameJson(old.input, input)) return this.receipt(old);
      throw new ConflictException({
        code: old ? "IDEMPOTENCY_CONFLICT" : "TURN_IN_PROGRESS",
        message: "La solicitud ya existe o hay otro turno activo.",
      });
    }
  }
  async snapshot(i: Identity, id: string) {
    const t = await this.db.agentTurn.findFirst({
      where: { id, conversation: { profileId: i.profileId } },
      include: { actions: true },
    });
    if (!t) throw new NotFoundException();
    return {
      id: t.id,
      conversationId: t.conversationId,
      status: t.status,
      revision: t.revision,
      assistantMessage: t.assistantMessage,
      uiSnapshot: t.uiSnapshot,
      pendingActions: t.actions.map((a) => ({
        id: a.id,
        status: a.status,
        expiresAt: a.expiresAt.getTime(),
        result: a.result,
      })),
      error: t.errorCode
        ? {
            code: t.errorCode,
            message:
              agentErrors[t.errorCode] ??
              "No se pudo completar la respuesta. Consulta el resultado de la acción antes de reintentar.",
          }
        : null,
      createdAt: t.createdAt.getTime(),
      updatedAt: t.updatedAt.getTime(),
    };
  }
  private async finish(
    id: string,
    title: string,
    explanation: string,
    components: unknown[],
    data: Record<string, unknown>,
  ) {
    const uiSnapshot = json(surface(id, title, explanation, components, data));
    await this.db.$transaction(async (tx) => {
      const t = await tx.agentTurn.update({
        where: { id },
        data: { status: "completed", revision: 1, assistantMessage: explanation, uiSnapshot },
      });
      await tx.message.create({
        data: {
          conversationId: t.conversationId,
          role: "assistant",
          content: explanation,
          turnId: id,
        },
      });
    });
  }
  private async run(id: string, i: Identity) {
    const trace: { tool: string; ms: number; ok: boolean }[] = [];
    const signal = AbortSignal.timeout(this.env.LLM_TIMEOUT_MS);
    let actionId: string | undefined;
    try {
      await this.auth.bySessionId(i.sessionId);
      const turn = await this.db.agentTurn.update({ where: { id }, data: { status: "running" } });
      const input = turnInputSchema.parse(turn.input);
      if (input.kind === "action" && input.event === "submit_movement_form") {
        const payload = movementSchema.parse(input.values);
        if (payload.date > todayInTimezone(i.timezone)) throw new Error("INVALID_DATE");
        const action = await this.db.pendingAction.create({
          data: {
            turnId: id,
            sessionId: i.sessionId,
            surfaceId: id,
            revision: 1,
            payload,
            expiresAt: new Date(Date.now() + 600000),
          },
        });
        await this.finish(
          id,
          "Confirma tu movimiento",
          "Revisa los datos antes de guardar el movimiento.",
          [
            {
              id: "confirmation",
              component: "BanorteConfirmation",
              data: { path: "/confirmation" },
              action: "confirm_movement",
            },
          ],
          { confirmation: { actionId: action.id, ...payload, cancelEvent: "cancel_movement" } },
        );
        return;
      }
      if (input.kind === "action" && input.event === "cancel_movement") {
        const result = await this.db.pendingAction.updateMany({
          where: { id: input.actionId, sessionId: i.sessionId, status: "pending" },
          data: { status: "cancelled" },
        });
        if (!result.count) throw new Error("ACTION_STATE_CONFLICT");
        await this.finish(id, "Registro cancelado", "No se registró el movimiento.", [], {});
        return;
      }
      if (input.kind === "action" && input.event === "confirm_movement") {
        actionId = input.actionId;
        const existing = await this.db.pendingAction.findFirst({
          where: {
            id: actionId,
            sessionId: i.sessionId,
            turn: { conversationId: turn.conversationId },
          },
        });
        if (!existing) throw new NotFoundException();
        if (existing.status === "pending" && existing.expiresAt.getTime() < Date.now())
          throw new GoneException();
        if (existing.status === "cancelled") throw new ConflictException();
        await this.db.pendingAction.updateMany({
          where: { id: actionId, status: "pending" },
          data: { status: "executing" },
        });
      }
      const names = (Object.keys(toolDefinitions) as ToolName[]).filter(
        (n) => n !== "register_movement" || Boolean(actionId),
      );
      await this.mcp.withClient(i, names, actionId, async (client) => {
        await client.listTools();
        const cached = new Map<ToolName, unknown>();
        const execute = async (name: ToolName, args: Record<string, unknown>) => {
          if (
            input.kind === "action" &&
            input.event === "change_period" &&
            ["list_movements", "get_spending_insights"].includes(name)
          )
            args = { ...args, ...input.values };
          signal.throwIfAborted();
          await this.auth.bySessionId(i.sessionId);
          const started = Date.now();
          const result = await client.callTool({ name, arguments: args }, undefined, {
            timeout: Math.min(10000, this.env.LLM_TIMEOUT_MS),
            signal,
          });
          trace.push({ tool: name, ms: Date.now() - started, ok: !result.isError });
          if (result.isError) throw new Error("MCP_TOOL_FAILED");
          const item = (result.content as { type: string; text?: string }[]).find(
            (x) => x.type === "text",
          );
          const value = result.structuredContent ?? JSON.parse(item?.text ?? "null");
          cached.set(name, value);
          return value;
        };
        if (actionId) {
          const result = await execute("register_movement", {});
          const balance = await execute("get_account_summary", {});
          const movements = await execute("list_movements", { pageSize: 5 });
          // The write is deterministic and authorized; the model receives its result for the next response.
          let explanation = "Movimiento guardado. Tu saldo e historial se actualizaron.";
          if (this.env.GEMINI_API_KEY?.trim()) {
            try {
              const plan = await this.llm.respond(
                [
                  {
                    role: "user",
                    content: `Se confirmó y guardó este movimiento. Explica brevemente el resultado: ${JSON.stringify({ result, balance })}`,
                  },
                ],
                execute,
                signal,
              );
              explanation = plan.explanation;
            } catch {
              /* Persisted action remains successful even if generation fails. */
            }
          }
          await this.finish(
            id,
            "Movimiento guardado",
            explanation,
            [
              { id: "result", component: "BanorteActionResult", data: { path: "/result" } },
              { id: "balance", component: "BanorteBalance", data: { path: "/balance" } },
              { id: "movements", component: "BanorteMovementTable", data: { path: "/movements" } },
            ],
            { result, balance, movements },
          );
          return;
        }
        const history = await this.db.message.findMany({
          where: { conversationId: turn.conversationId },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 12,
        });
        const context = history.reverse().map((m) => ({ role: m.role, content: m.content }));
        if (input.kind === "action" && input.event === "change_period")
          context.push({
            role: "user",
            content: `El usuario cambió el periodo a ${JSON.stringify(input.values)}. Actualiza la interfaz usando esos filtros.`,
          });
        if (input.kind === "action" && input.event === "simulate_savings") {
          const result = await execute("simulate_savings", input.values);
          await this.finish(
            id,
            "Tu escenario de ahorro",
            "Ajusta los importes, el plazo o la tasa para comparar escenarios. Esta proyección no mueve dinero.",
            [
              {
                id: "savings",
                component: "BanorteSavingsSimulator",
                data: { path: "/savings" },
                action: "simulate_savings",
              },
            ],
            { savings: { result } },
          );
          return;
        }
        const plan = await this.llm.respond(context, execute, signal);
        const data: Record<string, unknown> = {};
        const components: unknown[] = [];
        const add = (id: string, component: string, action?: string) =>
          components.push({
            id,
            component,
            data: { path: `/${id}` },
            ...(action ? { action } : {}),
          });
        for (const block of new Set(plan.blocks)) {
          if (block === "balance") {
            data.balance =
              cached.get("get_account_summary") ?? (await execute("get_account_summary", {}));
            add("balance", "BanorteBalance");
          }
          if (block === "movements") {
            data.movements =
              cached.get("list_movements") ??
              (await execute("list_movements", {
                pageSize: 8,
                ...(input.kind === "action" && input.event === "change_period" ? input.values : {}),
              }));
            add("movements", "BanorteMovementTable");
          }
          if (block === "spending") {
            data.spending =
              cached.get("get_spending_insights") ??
              (await execute(
                "get_spending_insights",
                input.kind === "action" && input.event === "change_period" ? input.values : {},
              ));
            add("spending", "BanorteSpendingChart");
            data.period = (data.spending as { period: { from: string; to: string } }).period;
            add("period", "BanortePeriodSelector", "change_period");
          }
          if (block === "cards") {
            data.cards = cached.get("list_my_cards") ?? (await execute("list_my_cards", {}));
            add("cards", "BanorteCardList");
          }
          if (block === "goals") {
            data.goals = cached.get("list_goals") ?? (await execute("list_goals", {}));
            add("goals", "BanorteGoalList");
          }
          if (block === "savings") {
            data.savings = { result: cached.get("simulate_savings") ?? null };
            add("savings", "BanorteSavingsSimulator", "simulate_savings");
          }
          if (block === "movementForm") {
            data.form = {
              categories,
              today: todayInTimezone(i.timezone),
              currency: "MXN",
              cards: await execute("list_my_cards", {}),
            };
            add("form", "BanorteMovementForm", "submit_movement_form");
          }
        }
        await this.finish(id, plan.title, plan.explanation, components, data);
      });
    } catch (e) {
      const providerStatus = e && typeof e === "object" && "status" in e ? e.status : undefined;
      const code = signal.aborted
        ? "LLM_TIMEOUT"
        : providerStatus === 429
          ? "LLM_QUOTA_EXCEEDED"
          : providerStatus === 503 || providerStatus === 502
            ? "LLM_UNAVAILABLE"
            : providerStatus === 401 || providerStatus === 403
              ? "LLM_AUTH_FAILED"
              : e instanceof Error &&
                  ["LLM_INVALID_OUTPUT", "TOOL_LIMIT", "INVALID_DATE"].includes(e.message)
                ? e.message
                : "AGENT_FAILED";
      const action = actionId
        ? await this.db.pendingAction.findUnique({ where: { id: actionId } })
        : null;
      if (action?.status === "completed")
        await this.finish(
          id,
          "Movimiento guardado",
          "El movimiento se guardó, pero no se pudo actualizar el análisis. Puedes consultar tu historial.",
          [{ id: "result", component: "BanorteActionResult", data: { path: "/result" } }],
          { result: action.result },
        );
      else
        await this.db.agentTurn.update({
          where: { id },
          data: { status: "failed", errorCode: code },
        });
    } finally {
      await this.db.agentTurn
        .update({ where: { id }, data: { trace: json(trace) } })
        .catch(() => {});
    }
  }
  async stream(i: Identity, id: string, res: import("express").Response) {
    let closed = false;
    res.on("close", () => {
      closed = true;
    });
    let previous = "";
    let count = 0;
    while (!closed) {
      try {
        await this.auth.bySessionId(i.sessionId);
        const snapshot = await this.snapshot(i, id);
        const signature = JSON.stringify(snapshot);
        if (signature !== previous) {
          res.write(`event: snapshot\ndata: ${signature}\n\n`);
          previous = signature;
        }
        if (terminal(snapshot.status)) {
          res.write(
            `event: done\ndata: ${JSON.stringify({ status: snapshot.status, revision: snapshot.revision })}\n\n`,
          );
          break;
        }
        if (++count % 15 === 0) res.write(": heartbeat\n\n");
      } catch {
        res.write('event: error\ndata: {"code":"UNAUTHENTICATED"}\n\n');
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    res.end();
  }
}
