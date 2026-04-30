import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private tx: TransactionsService,
  ) {}

  async summary() {
    const balanceCents = await this.tx.getBalanceCents();
    const latestBets = await this.prisma.bet.findMany({
      orderBy: { date: 'desc' },
      take: 10,
    });
    const users = await this.prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, email: true, name: true, role: true },
    });

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const betsWeek = await this.prisma.bet.count({ where: { date: { gte: since } } });

    return {
      balanceCents,
      latestBets,
      weekly: { betsCount: betsWeek, since },
      users,
    };
  }
}

