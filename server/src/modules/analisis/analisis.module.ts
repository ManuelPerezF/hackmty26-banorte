import { Controller, Get, Injectable, Module, Query } from "@nestjs/common";
import { z } from "zod";
import { DatabaseModule } from "../../database/database.module";
import { PrismaService } from "../../database/prisma.service";
import { Prisma } from "../../generated/prisma/client";
import { CurrentUser, Identity } from "../autenticacion/auth.types";
import { categories, dateSchema, todayInTimezone } from "../movimientos/schemas/movimiento.schema";
import { safeCents } from "../../shared/money";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
export const insightsSchema = z
  .strictObject({
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    category: z.enum(categories).optional(),
    bucket: z.enum(["day", "month"]).optional(),
  })
  .refine((q) => Boolean(q.from) === Boolean(q.to), "Indica ambas fechas.")
  .refine(
    (q) =>
      !q.from ||
      !q.to ||
      (q.from <= q.to && (Date.parse(q.to) - Date.parse(q.from)) / 86400000 < 366),
    "Rango inválido o mayor a 366 días.",
  );
export type InsightQuery = z.infer<typeof insightsSchema>;
export const traceSchema = z
  .strictObject({
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    category: z.enum(categories).optional(),
    limit: z.number().int().min(1).max(200).optional(),
  })
  .refine((q) => Boolean(q.from) === Boolean(q.to), "Indica ambas fechas.")
  .refine(
    (q) =>
      !q.from ||
      !q.to ||
      (q.from <= q.to && (Date.parse(q.to) - Date.parse(q.from)) / 86400000 < 366),
    "Rango inválido o mayor a 366 días.",
  );
export type TraceQuery = z.infer<typeof traceSchema>;
@Injectable()
export class AnalisisService {
  constructor(private readonly db: PrismaService) {}
  async spending(q: InsightQuery, i: Identity) {
    const today = todayInTimezone(i.timezone);
    const from = q.from ?? `${today.slice(0, 7)}-01`;
    const end = new Date(`${from}T00:00:00Z`);
    end.setUTCMonth(end.getUTCMonth() + 1, 0);
    const to = q.to ?? end.toISOString().slice(0, 10);
    const bucket =
      q.bucket ?? ((Date.parse(to) - Date.parse(from)) / 86400000 < 31 ? "day" : "month");
    const where: Prisma.MovementWhereInput = {
      accountId: i.accountId,
      category: q.category,
      date: { gte: new Date(`${from}T00:00:00Z`), lte: new Date(`${to}T00:00:00Z`) },
    };
    const [groups, count] = await this.db.$transaction(
      [
        this.db.movement.groupBy({
          by: ["date", "type", "category"],
          orderBy: { date: "asc" },
          where,
          _sum: { amountCents: true },
        }),
        this.db.movement.count({ where }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    let income = 0n,
      expense = 0n;
    const cats = new Map<string, bigint>();
    const series = new Map<string, { income: bigint; expense: bigint }>();
    for (
      let d = new Date(`${from}T00:00:00Z`);
      d.toISOString().slice(0, 10) <= to;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const day = d.toISOString().slice(0, 10);
      const k = bucket === "month" ? `${day.slice(0, 7)}-01` : day;
      series.set(k, { income: 0n, expense: 0n });
    }
    for (const row of groups) {
      const amount = row._sum?.amountCents ?? 0n;
      const day = row.date.toISOString().slice(0, 10);
      const k = bucket === "month" ? `${day.slice(0, 7)}-01` : day;
      const point = series.get(k)!;
      if (row.type === "income") {
        income += amount;
        point.income += amount;
      } else {
        expense += amount;
        point.expense += amount;
        cats.set(row.category, (cats.get(row.category) ?? 0n) + amount);
      }
    }
    return {
      currency: "MXN",
      period: { from, to, timezone: i.timezone },
      filters: { category: q.category ?? null },
      bucket,
      totals: {
        incomeCents: safeCents(income),
        expenseCents: safeCents(expense),
        netCents: safeCents(income - expense),
        movementCount: count,
      },
      categories: [...cats]
        .map(([category, total]) => ({
          category,
          expenseCents: safeCents(total),
          share: expense ? Number(total) / Number(expense) : 0,
        }))
        .sort((a, b) => b.expenseCents - a.expenseCents),
      series: [...series].map(([periodStart, v]) => ({
        periodStart,
        incomeCents: safeCents(v.income),
        expenseCents: safeCents(v.expense),
      })),
    };
  }
  async trace(q: TraceQuery, i: Identity) {
    const today = todayInTimezone(i.timezone);
    const from = q.from ?? `${today.slice(0, 7)}-01`;
    const to = q.to ?? today;
    const limit = q.limit ?? 100;
    const account = await this.db.account.findUniqueOrThrow({ where: { id: i.accountId } });
    const priorWhere: Prisma.MovementWhereInput = {
      accountId: i.accountId,
      date: { lt: new Date(`${from}T00:00:00Z`) },
    };
    const rangeWhere: Prisma.MovementWhereInput = {
      accountId: i.accountId,
      category: q.category,
      date: { gte: new Date(`${from}T00:00:00Z`), lte: new Date(`${to}T00:00:00Z`) },
    };
    const [priorSums, total, items] = await this.db.$transaction(
      [
        this.db.movement.groupBy({
          by: ["type"],
          orderBy: { type: "asc" },
          where: priorWhere,
          _sum: { amountCents: true },
        }),
        this.db.movement.count({ where: rangeWhere }),
        this.db.movement.findMany({
          where: rangeWhere,
          orderBy: [{ date: "asc" }, { createdAt: "asc" }, { id: "asc" }],
          take: limit,
          include: { card: { select: { last4: true, product: { select: { name: true } } } } },
        }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    const priorIncome = priorSums.find((s) => s.type === "income")?._sum?.amountCents ?? 0n;
    const priorExpense = priorSums.find((s) => s.type === "expense")?._sum?.amountCents ?? 0n;
    let running = account.openingBalanceCents + priorIncome - priorExpense;
    const openingBalanceCents = safeCents(running);
    const trace = items.map((m) => {
      running += m.type === "income" ? m.amountCents : -m.amountCents;
      return {
        id: m.id,
        date: m.date.toISOString().slice(0, 10),
        description: m.description,
        type: m.type,
        category: m.category,
        amountCents: safeCents(m.amountCents),
        runningBalanceCents: safeCents(running),
        card: m.card ? { last4: m.card.last4, product: { name: m.card.product.name } } : null,
      };
    });
    return {
      currency: account.currency,
      period: { from, to },
      filters: { category: q.category ?? null },
      openingBalanceCents,
      closingBalanceCents: safeCents(running),
      total,
      truncated: total > items.length,
      items: trace,
    };
  }
}
@Controller("insights")
class AnalisisController {
  constructor(private readonly service: AnalisisService) {}
  @Get("spending") spending(
    @Query(new ZodValidationPipe(insightsSchema)) q: InsightQuery,
    @CurrentUser() i: Identity,
  ) {
    return this.service.spending(q, i);
  }
  @Get("trace") trace(
    @Query(new ZodValidationPipe(traceSchema)) q: TraceQuery,
    @CurrentUser() i: Identity,
  ) {
    return this.service.trace(q, i);
  }
}
@Module({
  imports: [DatabaseModule],
  providers: [AnalisisService],
  controllers: [AnalisisController],
  exports: [AnalisisService],
})
export class AnalisisModule {}
