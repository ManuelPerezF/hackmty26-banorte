import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ENV, Environment } from '../../../config/env';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { safeCents } from '../../../shared/money';

@Injectable()
export class CuentasService {
  constructor(private readonly prisma: PrismaService, @Inject(ENV) private readonly env: Environment) {}
  async summary() {
    const [account, sums] = await this.prisma.$transaction([
      this.prisma.account.findUnique({ where: { id: this.env.DEMO_ACCOUNT_ID } }),
      this.prisma.movement.groupBy({ by: ['type'], orderBy: { type: 'asc' }, where: { accountId: this.env.DEMO_ACCOUNT_ID }, _sum: { amountCents: true } }),
    ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    if (!account) throw new NotFoundException('Cuenta demo no encontrada. Ejecuta db:seed.');
    const income = sums.find(item => item.type === 'income')?._sum?.amountCents ?? 0n;
    const expense = sums.find(item => item.type === 'expense')?._sum?.amountCents ?? 0n;
    return { id: account.id, name: account.name, currency: account.currency, mode: 'demo',
      openingBalanceCents: safeCents(account.openingBalanceCents), incomeCents: safeCents(income), expenseCents: safeCents(expense),
      balanceCents: safeCents(account.openingBalanceCents + income - expense) };
  }
}
