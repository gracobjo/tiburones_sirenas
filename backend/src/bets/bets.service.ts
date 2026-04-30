import { Injectable, NotFoundException } from '@nestjs/common';
import { BetStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../notifications/telegram.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { UpdateBetDto } from './dto/update-bet.dto';

@Injectable()
export class BetsService {
  constructor(
    private prisma: PrismaService,
    private telegram: TelegramService,
  ) {}

  async list() {
    return this.prisma.bet.findMany({
      orderBy: { date: 'desc' },
    });
  }

  async create(input: CreateBetDto & { storedFileUrl?: string | null }) {
    const date = input.date ? new Date(input.date) : new Date();
    const fileUrl = input.storedFileUrl ?? input.fileUrl ?? null;

    const bet = await this.prisma.bet.create({
      data: {
        date,
        amount: input.amount,
        betCode: input.betCode,
        fileUrl,
        status: BetStatus.pending,
      },
    });

    await this.prisma.transaction.create({
      data: {
        type: TransactionType.bet,
        amount: bet.amount,
        description: `Apuesta ${bet.betCode}`,
      },
    });

    await this.telegram.safeSendMessage(
      `🎟️ Nueva apuesta creada\nCódigo: ${bet.betCode}\nImporte: ${(bet.amount / 100).toFixed(2)}€`,
    );

    return bet;
  }

  async update(id: string, dto: UpdateBetDto) {
    const existing = await this.prisma.bet.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Bet not found');

    const validatedAt =
      dto.status && dto.status !== BetStatus.pending ? new Date() : undefined;

    return this.prisma.bet.update({
      where: { id },
      data: {
        status: dto.status,
        prizeAmount: dto.prizeAmount,
        validatedAt,
      },
    });
  }
}

