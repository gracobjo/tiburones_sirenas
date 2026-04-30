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

  async getById(id: string) {
    const bet = await this.prisma.bet.findUnique({ where: { id } });
    if (!bet) throw new NotFoundException('Bet not found');
    return bet;
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

    const nextAmount = typeof dto.amount === 'number' ? dto.amount : existing.amount;
    const amountDiff = nextAmount - existing.amount;
    const nextBetCode = dto.betCode?.trim() || existing.betCode;

    const validatedAt =
      dto.status && dto.status !== BetStatus.pending ? new Date() : undefined;

    const updated = await this.prisma.bet.update({
      where: { id },
      data: {
        betCode: dto.betCode ? dto.betCode.trim() : undefined,
        date: dto.date ? new Date(dto.date) : undefined,
        amount: dto.amount,
        status: dto.status,
        prizeAmount: dto.prizeAmount,
        validatedAt,
      },
    });

    // Mantener balance consistente: al crear una bet se registra un TransactionType.bet.
    // Si cambia el importe, registramos el delta como bet (si sube) o adjustment (si baja).
    if (amountDiff !== 0) {
      if (amountDiff > 0) {
        await this.prisma.transaction.create({
          data: {
            type: TransactionType.bet,
            amount: amountDiff,
            description: `Ajuste importe apuesta ${nextBetCode}`,
          },
        });
      } else {
        await this.prisma.transaction.create({
          data: {
            type: TransactionType.adjustment,
            amount: -amountDiff,
            description: `Reembolso ajuste apuesta ${nextBetCode}`,
          },
        });
      }
    }

    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.bet.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Bet not found');

    // No tenemos FK a la transacción de tipo "bet". Revertimos el impacto con un adjustment.
    await this.prisma.transaction.create({
      data: {
        type: TransactionType.adjustment,
        amount: existing.amount,
        description: `Reverso borrado apuesta ${existing.betCode}`,
      },
    });

    await this.prisma.bet.delete({ where: { id } });
    return { ok: true };
  }
}

