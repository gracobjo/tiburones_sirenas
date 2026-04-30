import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const RESULTS_URL_KEY = 'resultsUrl';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getResultsUrl() {
    const row = await this.prisma.setting.findUnique({ where: { key: RESULTS_URL_KEY } });
    return row?.value ?? 'https://www.loteriasyapuestas.es';
  }

  async setResultsUrl(url: string) {
    const value = url.trim();
    return this.prisma.setting.upsert({
      where: { key: RESULTS_URL_KEY },
      create: { key: RESULTS_URL_KEY, value },
      update: { value },
      select: { key: true, value: true, updatedAt: true },
    });
  }
}

