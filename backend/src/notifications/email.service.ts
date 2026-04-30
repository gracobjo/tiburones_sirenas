import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private config: ConfigService) {}

  private createTransport() {
    const host = this.config.get<string>('EMAIL_HOST');
    const user = this.config.get<string>('EMAIL_USER');
    const pass = this.config.get<string>('EMAIL_PASS');
    const port = Number(this.config.get<string>('EMAIL_PORT') ?? 587);
    const secure = (this.config.get<string>('EMAIL_SECURE') ?? 'false') === 'true';

    if (!host || !user || !pass) {
      throw new Error('Missing EMAIL_HOST / EMAIL_USER / EMAIL_PASS');
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  async sendWeeklySummary(to: string, subject: string, text: string) {
    const from = this.config.get<string>('EMAIL_FROM') ?? this.config.get<string>('EMAIL_USER');
    if (!from) throw new Error('Missing EMAIL_FROM/EMAIL_USER');

    const transporter = this.createTransport();
    await transporter.sendMail({ from, to, subject, text });
  }

  async safeSendWeeklySummary(to: string, subject: string, text: string) {
    try {
      await this.sendWeeklySummary(to, subject, text);
    } catch (err) {
      this.logger.warn(`Email send failed: ${(err as Error).message}`);
    }
  }
}

