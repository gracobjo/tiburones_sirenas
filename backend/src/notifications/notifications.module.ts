import { Global, Module } from '@nestjs/common';
import { TransactionsModule } from '../transactions/transactions.module';
import { EmailService } from './email.service';
import { TelegramService } from './telegram.service';
import { WeeklySummaryCron } from './weekly-summary.cron';

@Global()
@Module({
  imports: [TransactionsModule],
  providers: [TelegramService, EmailService, WeeklySummaryCron],
  exports: [TelegramService, EmailService],
})
export class NotificationsModule {}

