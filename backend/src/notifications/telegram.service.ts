import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private config: ConfigService) {}

  async sendMessage(text: string) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.config.get<string>('TELEGRAM_CHAT_ID');
    if (!token || !chatId) {
      throw new Error('Missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID');
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await axios.post(url, { chat_id: chatId, text });
  }

  async safeSendMessage(text: string) {
    try {
      await this.sendMessage(text);
    } catch (err) {
      this.logger.warn(`Telegram send failed: ${(err as Error).message}`);
    }
  }
}

