import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../notifications/telegram.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private telegram: TelegramService,
  ) {}

  async list() {
    return this.prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateTransactionDto) {
    const tx = await this.prisma.transaction.create({
      data: {
        type: dto.type,
        amount: dto.amount,
        description: dto.description,
      },
    });

    if (tx.type === TransactionType.prize) {
      await this.telegram.safeSendMessage(
        `🏆 Premio registrado: +${(tx.amount / 100).toFixed(2)}€${tx.description ? `\n${tx.description}` : ''}`,
      );
    }

    return tx;
  }

  async getBalanceCents() {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['type'],
      _sum: { amount: true },
    });
    const sumBy = (type: TransactionType) =>
      grouped.find((g) => g.type === type)?._sum.amount ?? 0;

    const deposits = sumBy(TransactionType.deposit);
    const prizes = sumBy(TransactionType.prize);
    const bets = sumBy(TransactionType.bet);
    const adjustments = sumBy(TransactionType.adjustment);

    return deposits + prizes + adjustments - bets;
  }
}

