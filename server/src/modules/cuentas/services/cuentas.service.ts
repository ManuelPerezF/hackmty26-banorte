import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Identity } from "../../autenticacion/auth.types";
import { PrismaService } from "../../../database/prisma.service";
import { Prisma } from "../../../generated/prisma/client";
import { safeCents } from "../../../shared/money";

@Injectable()
export class CuentasService {
  constructor(private readonly prisma: PrismaService) {}
  async summary(identity: Identity) {
    const [account, sums] = await this.prisma.$transaction(
      [
        this.prisma.account.findUnique({ where: { id: identity.accountId } }),
        this.prisma.movement.groupBy({
          by: ["type"],
          orderBy: { type: "asc" },
          where: { accountId: identity.accountId },
          _sum: { amountCents: true },
        }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    if (!account) throw new NotFoundException("Cuenta no encontrada.");
    const income = sums.find((item) => item.type === "income")?._sum?.amountCents ?? 0n;
    const expense = sums.find((item) => item.type === "expense")?._sum?.amountCents ?? 0n;
    return {
      id: account.id,
      name: account.name,
      currency: account.currency,
      openingBalanceCents: safeCents(account.openingBalanceCents),
      incomeCents: safeCents(income),
      expenseCents: safeCents(expense),
      balanceCents: safeCents(account.openingBalanceCents + income - expense),
    };
  }
}
