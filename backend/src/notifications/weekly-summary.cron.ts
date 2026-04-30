import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { EmailService } from './email.service';
import { TelegramService } from './telegram.service';
import { ConfigService } from '@nestjs/config';

function formatEur(cents: number) {
  return `${(cents / 100).toFixed(2)}€`;
}

@Injectable()
export class WeeklySummaryCron {
  constructor(
    private prisma: PrismaService,
    private tx: TransactionsService,
    private telegram: TelegramService,
    private email: EmailService,
    private config: ConfigService,
  ) {}

  @Cron('0 9 * * 1') // lunes 09:00
  async handleWeeklySummary() {
    const { text, telegramText } = await this.buildSummary();
    await this.telegram.safeSendMessage(telegramText);

    const weeklyEmailTo = this.config.get<string>('WEEKLY_EMAIL_TO');
    if (weeklyEmailTo) {
      await this.email.safeSendWeeklySummary(
        weeklyEmailTo,
        'Resumen semanal - Peña de apuestas',
        text,
      );
    }
  }

  async buildSummary() {
    const balance = await this.tx.getBalanceCents();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const betsWeek = await this.prisma.bet.findMany({
      where: { date: { gte: since } },
      orderBy: { date: 'desc' },
    });

    const betsCount = betsWeek.length;
    const betsAmount = betsWeek.reduce((acc, b) => acc + b.amount, 0);
    const prizesWeek = betsWeek.reduce((acc, b) => acc + (b.prizeAmount ?? 0), 0);

    const telegramText =
      `📊 Resumen semanal:\n` +
      `💰 Fondo: ${formatEur(balance)}\n` +
      `🎟️ Apuestas: ${betsCount} (${formatEur(betsAmount)})\n` +
      `🏆 Premios (en apuestas): +${formatEur(prizesWeek)}`;

    const text =
      `Resumen semanal\n\n` +
      `Fondo actual: ${formatEur(balance)}\n` +
      `Apuestas semana: ${betsCount}\n` +
      `Total apostado semana: ${formatEur(betsAmount)}\n` +
      `Premios (según apuestas): +${formatEur(prizesWeek)}\n\n` +
      `Apuestas:\n` +
      betsWeek
        .slice(0, 20)
        .map((b) => `- ${b.betCode} | ${formatEur(b.amount)} | ${b.status}`)
        .join('\n');

    return { telegramText, text };
  }
}

