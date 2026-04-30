import { Transform } from 'class-transformer';
import { TransactionType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type!: TransactionType;

  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsInt()
  @Min(1)
  amount!: number; // cents

  @IsOptional()
  @IsString()
  description?: string;
}

