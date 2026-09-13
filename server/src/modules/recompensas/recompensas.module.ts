import { Controller, Get, Injectable, Module, Query } from "@nestjs/common";
import { z } from "zod";
import { DatabaseModule } from "../../database/database.module";
import { PrismaService } from "../../database/prisma.service";
import { CurrentUser, Identity } from "../autenticacion/auth.types";
import { dateSchema, todayInTimezone } from "../movimientos/schemas/movimiento.schema";
import { safeCents } from "../../shared/money";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import { pickRate, pointsFor, PointsRate, RateChunk } from "./reward-rates";

export const rewardQuerySchema = z
  .strictObject({ from: dateSchema.optional(), to: dateSchema.optional() })
  .refine((q) => Boolean(q.from) === Boolean(q.to), "Indica ambas fechas.")
  .refine(
    (q) =>
      !q.from ||
      !q.to ||
      (q.from <= q.to && (Date.parse(q.to) - Date.parse(q.from)) / 86400000 < 366),
    "Rango inválido o mayor a 366 días.",
  );

@Injectable()
export class RecompensasService {
  constructor(private readonly db: PrismaService) {}

  /** Una tasa por producto, con la cita del fragmento que la respalda. */
  async rates(today: string): Promise<Record<string, PointsRate | null>> {
    const rows = await this.db.$queryRaw<(RateChunk & { product: string })[]>`
      SELECT d."product", d."slug", d."title", c."page", c."text",
        c."validFrom"::text AS "validFrom", c."validTo"::text AS "validTo"
      FROM "KnowledgeChunk" c JOIN "KnowledgeDocument" d ON d."id" = c."documentId"
      WHERE d."active" AND c."text" ~* 'puntos? por cada|por cada \\$?\\s*10 pesos'
      ORDER BY d."product", c."page"`;
    const byProduct = new Map<string, RateChunk[]>();
    for (const row of rows)
      byProduct.set(row.product, [...(byProduct.get(row.product) ?? []), row]);
    const products = await this.db.cardProduct.findMany({ select: { key: true } });
    return Object.fromEntries(
      products.map((p) => [p.key, pickRate(byProduct.get(p.key) ?? [], today)]),
    );
  }

  async points(i: Identity, q: z.infer<typeof rewardQuerySchema>) {
    const today = todayInTimezone(i.timezone);
    const from = q.from ?? `${today.slice(0, 7)}-01`;
    const end = new Date(`${from}T00:00:00Z`);
    end.setUTCMonth(end.getUTCMonth() + 1, 0);
    const to = q.to ?? end.toISOString().slice(0, 10);

    const [rates, cards, movements] = await Promise.all([
      this.rates(today),
      this.db.card.findMany({
        where: { profileId: i.profileId },
        include: { product: true },
      }),
      // Solo compras con tarjeta: los cargos a cuenta y los ingresos no
      // generan puntos según el programa.
      this.db.movement.findMany({
        where: {
          accountId: i.accountId,
          type: "expense",
          cardId: { not: null },
          date: { gte: new Date(`${from}T00:00:00Z`), lte: new Date(`${to}T00:00:00Z`) },
        },
        select: { cardId: true, amountCents: true },
      }),
    ]);

    const perCard = cards.map((card) => {
      const rate = rates[card.productKey];
      const own = movements.filter((m) => m.cardId === card.id);
      const spentCents = own.reduce((t, m) => t + safeCents(m.amountCents), 0);
      const points = rate
        ? own.reduce((t, m) => t + pointsFor(safeCents(m.amountCents), rate.pointsPer10Pesos), 0)
        : null;
      return {
        cardId: card.id,
        product: card.productKey,
        productName: card.product.name,
        last4: card.last4,
        spentCents,
        purchases: own.length,
        pointsPer10Pesos: rate?.pointsPer10Pesos ?? null,
        points: points === null ? null : Math.round(points * 100) / 100,
        source: rate?.source ?? null,
      };
    });

    const totalSpentCents = perCard.reduce((t, c) => t + c.spentCents, 0);
    // Qué habría pasado con todo el gasto en cada producto que ya tienes: la
    // diferencia entre tarjetas se vuelve una cifra, no una promesa.
    const hypothetical = Object.entries(rates)
      .filter(([, r]) => r)
      .map(([product, r]) => ({
        product,
        pointsPer10Pesos: r!.pointsPer10Pesos,
        points: pointsFor(totalSpentCents, r!.pointsPer10Pesos),
        owned: cards.some((c) => c.productKey === product),
      }));

    return {
      period: { from, to },
      cards: perCard,
      totalPoints: Math.round(perCard.reduce((t, c) => t + (c.points ?? 0), 0) * 100) / 100,
      totalSpentCents,
      hypothetical,
      assumptions: {
        program: "Recompensa Total Banorte",
        basis: "tasa leída del folleto vigente o la guía del producto",
        counts: ["compras con tarjeta"],
        excludes: ["ingresos", "cargos directos a cuenta"],
        rounding: "por movimiento, decenas completas de pesos",
        requiresEnrollment: true,
      },
    };
  }
}

@Controller("rewards")
class RecompensasController {
  constructor(private readonly service: RecompensasService) {}
  @Get("points") points(
    @CurrentUser() i: Identity,
    @Query(new ZodValidationPipe(rewardQuerySchema)) q: z.infer<typeof rewardQuerySchema>,
  ) {
    return this.service.points(i, q);
  }
}

@Module({
  imports: [DatabaseModule],
  controllers: [RecompensasController],
  providers: [RecompensasService],
  exports: [RecompensasService],
})
export class RecompensasModule {}
