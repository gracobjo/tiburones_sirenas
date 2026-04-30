import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private tx: TransactionsService) {}

  @Get()
  async list() {
    return this.tx.list();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.admin)
  async create(@Body() dto: CreateTransactionDto) {
    return this.tx.create(dto);
  }
}

