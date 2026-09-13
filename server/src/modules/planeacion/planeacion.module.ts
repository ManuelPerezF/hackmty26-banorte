import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Injectable,
  Module,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from "@nestjs/common";
import { z } from "zod";
import { CuentasModule } from "../cuentas/cuentas.module";
import { CuentasService } from "../cuentas/services/cuentas.service";
import { DatabaseModule } from "../../database/database.module";
import { PrismaService } from "../../database/prisma.service";
import { Prisma } from "../../generated/prisma/client";
import { CurrentUser, Identity } from "../autenticacion/auth.types";
import { categories, todayInTimezone } from "../movimientos/schemas/movimiento.schema";
import { key, sameJson } from "../../shared/requests";
import { safeCents } from "../../shared/money";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import { forecastMonth } from "./forecast";
import { computeHealthScore } from "./health-score";
import { suggestCoachActions } from "./coach-actions";

const amountCents = z.number().int().min(1).max(100000000);
export const budgetSchema = z.strictObject({
  category: z.enum(categories),
  amountCents,
});
export const recurrenceSchema = z.strictObject({
  description: z.string().trim().min(1).max(80),
  category: z.enum(categories),
  amountCents,
  type: z.enum(["income", "expense"]),
  // 28 es el tope a propósito: cualquier día mayor no existe en febrero y el
  // cargo se saltaría un mes al año.
  dayOfMonth: z.number().int().min(1).max(28),
  cardId: z.uuid().nullable().optional(),
});
export const contributionSchema = z.strictObject({
  goalId: z.uuid(),
  amountCents,
});

@Injectable()
export class PlaneacionService {
  constructor(
    private readonly db: PrismaService,
    private readonly accounts: CuentasService,
  ) {}

  /** Gasto del mes en curso por categoría, base de presupuestos y proyección. */
  private async monthSpending(i: Identity) {
    const today = todayInTimezone(i.timezone);
    const from = `${today.slice(0, 7)}-01`;
    const end = new Date(`${from}T00:00:00Z`);
    end.setUTCMonth(end.getUTCMonth() + 1, 0);
    const rows = await this.db.movement.groupBy({
      by: ["category", "type"],
      where: {
        accountId: i.accountId,
        date: { gte: new Date(`${from}T00:00:00Z`), lte: end },
      },
      _sum: { amountCents: true },
    });
    const byCategory = new Map<string, number>();
    let incomeCents = 0;
    let expenseCents = 0;
    for (const row of rows) {
      const amount = safeCents(row._sum?.amountCents ?? 0n);
      if (row.type === "income") incomeCents += amount;
      else {
        expenseCents += amount;
        byCategory.set(row.category, (byCategory.get(row.category) ?? 0) + amount);
      }
    }
    return { today, from, incomeCents, expenseCents, byCategory };
  }

  async budgets(i: Identity) {
    const [rows, spending] = await Promise.all([
      this.db.budget.findMany({ where: { profileId: i.profileId }, orderBy: { category: "asc" } }),
      this.monthSpending(i),
    ]);
    const items = rows.map((b) => {
      const spentCents = spending.byCategory.get(b.category) ?? 0;
      const limitCents = safeCents(b.amountCents);
      const usagePct = Math.round((spentCents / limitCents) * 100);
      return {
        id: b.id,
        category: b.category,
        limitCents,
        spentCents,
        remainingCents: limitCents - spentCents,
        usagePct,
        // Dos umbrales, no una escala continua: el aviso debe caber en una pill.
        status: usagePct >= 100 ? "exceeded" : usagePct >= 80 ? "warning" : "on_track",
      };
    });
    return {
      items,
      period: { from: spending.from, today: spending.today },
      totalLimitCents: items.reduce((t, b) => t + b.limitCents, 0),
      totalSpentCents: items.reduce((t, b) => t + b.spentCents, 0),
    };
  }

  /** Un presupuesto por categoría: volver a enviarla actualiza el monto. */
  async setBudget(i: Identity, b: z.infer<typeof budgetSchema>) {
    const saved = await this.db.budget.upsert({
      where: { profileId_category: { profileId: i.profileId, category: b.category } },
      create: { profileId: i.profileId, category: b.category, amountCents: BigInt(b.amountCents) },
      update: { amountCents: BigInt(b.amountCents) },
    });
    return { id: saved.id, category: saved.category, limitCents: safeCents(saved.amountCents) };
  }

  async removeBudget(i: Identity, id: string) {
    const { count } = await this.db.budget.deleteMany({ where: { id, profileId: i.profileId } });
    if (!count) throw new NotFoundException();
    return { deleted: true };
  }

  async recurrences(i: Identity) {
    const rows = await this.db.recurrence.findMany({
      where: { profileId: i.profileId, active: true },
      orderBy: { dayOfMonth: "asc" },
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        description: r.description,
        category: r.category,
        amountCents: safeCents(r.amountCents),
        type: r.type,
        dayOfMonth: r.dayOfMonth,
        cardId: r.cardId,
      })),
    };
  }

  async addRecurrence(i: Identity, b: z.infer<typeof recurrenceSchema>) {
    if (b.cardId) {
      const owned = await this.db.card.findFirst({
        where: { id: b.cardId, profileId: i.profileId, status: "active" },
      });
      if (!owned) throw new NotFoundException("Tarjeta no encontrada.");
    }
    const saved = await this.db.recurrence.create({
      data: {
        profileId: i.profileId,
        description: b.description,
        category: b.category,
        amountCents: BigInt(b.amountCents),
        type: b.type,
        dayOfMonth: b.dayOfMonth,
        cardId: b.cardId ?? null,
      },
    });
    return { id: saved.id, description: saved.description, dayOfMonth: saved.dayOfMonth };
  }

  async removeRecurrence(i: Identity, id: string) {
    const { count } = await this.db.recurrence.updateMany({
      where: { id, profileId: i.profileId },
      data: { active: false },
    });
    if (!count) throw new NotFoundException();
    return { deleted: true };
  }

  async forecast(i: Identity) {
    const [spending, recurrences, budgets] = await Promise.all([
      this.monthSpending(i),
      this.recurrences(i),
      this.db.budget.findMany({ where: { profileId: i.profileId } }),
    ]);
    return {
      currency: "MXN",
      period: { from: spending.from, today: spending.today },
      ...forecastMonth({
        spentCents: spending.expenseCents,
        today: spending.today,
        recurrences: recurrences.items,
        budgetTotalCents: budgets.reduce((t, b) => t + safeCents(b.amountCents), 0),
      }),
      assumptions: {
        method: "promedio-diario-del-mes-en-curso",
        includes: ["gasto registrado", "cargos fijos pendientes"],
        excludes: ["inflación", "gastos atípicos no registrados"],
        guaranteed: false,
      },
    };
  }

  /** Metas con lo aportado, que es lo que el score y el coach necesitan. */
  async goalsWithProgress(i: Identity) {
    const [goals, sums] = await Promise.all([
      this.db.goal.findMany({ where: { profileId: i.profileId }, orderBy: { createdAt: "desc" } }),
      this.db.goalContribution.groupBy({
        by: ["goalId"],
        where: { profileId: i.profileId },
        _sum: { amountCents: true },
      }),
    ]);
    const saved = new Map(sums.map((s) => [s.goalId, safeCents(s._sum?.amountCents ?? 0n)]));
    return goals.map((g) => ({
      id: g.id,
      name: g.name,
      targetCents: safeCents(g.targetCents),
      savedCents: saved.get(g.id) ?? 0,
      deadline: g.deadline?.toISOString().slice(0, 10) ?? null,
      status: g.status,
      updatedAt: g.updatedAt.getTime(),
    }));
  }

  async health(i: Identity) {
    const [spending, budgetView, goals] = await Promise.all([
      this.monthSpending(i),
      this.budgets(i),
      this.goalsWithProgress(i),
    ]);
    const active = goals.filter((g) => g.status === "active");
    return {
      period: { from: spending.from, today: spending.today },
      incomeCents: spending.incomeCents,
      expenseCents: spending.expenseCents,
      ...computeHealthScore({
        incomeCents: spending.incomeCents,
        expenseCents: spending.expenseCents,
        budgets: budgetView.items.map((b) => ({
          amountCents: b.limitCents,
          spentCents: b.spentCents,
        })),
        goals: active.map((g) => ({ targetCents: g.targetCents, savedCents: g.savedCents })),
      }),
    };
  }

  /** Las sugerencias se derivan de datos propios; el modelo no las escribe. */
  async coachActions(i: Identity) {
    const [goals, budgetView, account] = await Promise.all([
      this.goalsWithProgress(i),
      this.budgets(i),
      this.accounts.summary(i),
    ]);
    return {
      items: suggestCoachActions({
        goals,
        budgets: budgetView.items.map((b) => ({
          category: b.category,
          amountCents: b.limitCents,
          spentCents: b.spentCents,
        })),
        balanceCents: account.balanceCents,
      }),
    };
  }

  /**
   * Registra una aportación a una meta. Es una anotación de plan: no mueve
   * dinero de la cuenta. `requestKey` la hace idempotente, igual que los
   * movimientos, para que un reintento no duplique el avance.
   */
  async contribute(i: Identity, b: z.infer<typeof contributionSchema>, requestKey: string) {
    const goal = await this.db.goal.findFirst({
      where: { id: b.goalId, profileId: i.profileId, status: "active" },
    });
    if (!goal) throw new NotFoundException("Meta no encontrada o archivada.");
    try {
      await this.db.goalContribution.create({
        data: {
          goalId: goal.id,
          profileId: i.profileId,
          amountCents: BigInt(b.amountCents),
          requestKey,
        },
      });
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") throw e;
      const old = await this.db.goalContribution.findUniqueOrThrow({
        where: { profileId_requestKey: { profileId: i.profileId, requestKey } },
      });
      if (!sameJson({ goalId: old.goalId, amountCents: safeCents(old.amountCents) }, b))
        throw new NotFoundException("Clave usada con otros datos.");
    }
    const [progress] = await this.goalsWithProgress(i).then((all) =>
      all.filter((g) => g.id === goal.id),
    );
    return { goal: progress, contributedCents: b.amountCents };
  }
}

@Controller()
class PlaneacionController {
  constructor(private readonly service: PlaneacionService) {}
  @Get("budgets") budgets(@CurrentUser() i: Identity) {
    return this.service.budgets(i);
  }
  @Put("budgets") setBudget(
    @CurrentUser() i: Identity,
    @Body(new ZodValidationPipe(budgetSchema)) b: z.infer<typeof budgetSchema>,
  ) {
    return this.service.setBudget(i, b);
  }
  @Delete("budgets/:id") removeBudget(
    @CurrentUser() i: Identity,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.service.removeBudget(i, id);
  }
  @Get("recurrences") recurrences(@CurrentUser() i: Identity) {
    return this.service.recurrences(i);
  }
  @Post("recurrences") addRecurrence(
    @CurrentUser() i: Identity,
    @Body(new ZodValidationPipe(recurrenceSchema)) b: z.infer<typeof recurrenceSchema>,
  ) {
    return this.service.addRecurrence(i, b);
  }
  @Delete("recurrences/:id") removeRecurrence(
    @CurrentUser() i: Identity,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.service.removeRecurrence(i, id);
  }
  @Get("forecast") forecast(@CurrentUser() i: Identity) {
    return this.service.forecast(i);
  }
  @Get("financial-health") health(@CurrentUser() i: Identity) {
    return this.service.health(i);
  }
  @Post("goal-contributions") contribute(
    @CurrentUser() i: Identity,
    @Body(new ZodValidationPipe(contributionSchema)) b: z.infer<typeof contributionSchema>,
    @Headers("idempotency-key") k: unknown,
  ) {
    return this.service.contribute(i, b, key(k));
  }
}

@Module({
  imports: [DatabaseModule, CuentasModule],
  controllers: [PlaneacionController],
  providers: [PlaneacionService],
  exports: [PlaneacionService],
})
export class PlaneacionModule {}
