import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Identity } from "../../autenticacion/auth.types";
import { PrismaService } from "../../../database/prisma.service";
import { Movement, Prisma } from "../../../generated/prisma/client";
import { safeCents } from "../../../shared/money";
import { CreateMovement, MovementQuery, todayInTimezone } from "../schemas/movimiento.schema";

export function serializeMovement(item: Movement) {
  const { accountId, idempotencyKey, ...record } = item;
  return {
    ...record,
    amountCents: safeCents(item.amountCents),
    date: item.date.toISOString().slice(0, 10),
    createdAt: item.createdAt.getTime(),
  };
}

@Injectable()
export class MovimientosService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: MovementQuery, identity: Identity) {
    const where: Prisma.MovementWhereInput = {
      accountId: identity.accountId,
      type: query.type,
      category: query.category,
      date:
        query.from || query.to
          ? {
              gte: query.from ? new Date(`${query.from}T00:00:00Z`) : undefined,
              lte: query.to ? new Date(`${query.to}T00:00:00Z`) : undefined,
            }
          : undefined,
      OR: query.query
        ? ["description", "category", "notes"].map((field) => ({
            [field]: { contains: query.query, mode: "insensitive" },
          }))
        : undefined,
    };
    const [items, total, sums] = await this.prisma.$transaction(
      [
        this.prisma.movement.findMany({
          where,
          orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
        this.prisma.movement.count({ where }),
        this.prisma.movement.groupBy({
          by: ["type"],
          orderBy: { type: "asc" },
          where,
          _sum: { amountCents: true },
        }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    const sum = (type: "income" | "expense") =>
      sums.find((item) => item.type === type)?._sum?.amountCents ?? 0n;
    return {
      items: items.map(serializeMovement),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totals: {
        incomeCents: safeCents(sum("income")),
        expenseCents: safeCents(sum("expense")),
        netCents: safeCents(sum("income") - sum("expense")),
      },
    };
  }

  async findOne(id: string, identity: Identity) {
    const item = await this.prisma.movement.findFirst({
      where: { id, accountId: identity.accountId },
    });
    if (!item) throw new NotFoundException("Movimiento no encontrado.");
    return serializeMovement(item);
  }

  async create(input: CreateMovement, idempotencyKey: string, identity: Identity) {
    if (input.date > todayInTimezone(identity.timezone))
      throw new BadRequestException("La fecha no puede ser posterior a hoy.");
    try {
      const item = await this.prisma.movement.create({
        data: {
          ...input,
          date: new Date(`${input.date}T00:00:00Z`),
          amountCents: BigInt(input.amountCents),
          accountId: identity.accountId,
          idempotencyKey,
          source: "manual",
        },
      });
      return serializeMovement(item);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002")
        throw error;
      const existing = await this.prisma.movement.findUnique({
        where: { accountId_idempotencyKey: { accountId: identity.accountId, idempotencyKey } },
      });
      if (
        !existing ||
        existing.description !== input.description ||
        existing.amountCents !== BigInt(input.amountCents) ||
        existing.type !== input.type ||
        existing.category !== input.category ||
        existing.notes !== input.notes ||
        existing.date.toISOString().slice(0, 10) !== input.date
      ) {
        throw new ConflictException("La clave de idempotencia ya se usó con otros datos.");
      }
      return serializeMovement(existing);
    }
  }
}
