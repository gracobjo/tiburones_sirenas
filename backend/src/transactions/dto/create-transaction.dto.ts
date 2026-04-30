import { Transform } from 'class-transformer';
import { TransactionType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min, NotEquals, ValidateIf } from 'class-validator';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type!: TransactionType;

  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const normalized = value.trim().replace(',', '.');
    return Number(normalized);
  })
  @IsInt()
  @NotEquals(0)
  @ValidateIf((o: CreateTransactionDto) => o.type !== TransactionType.adjustment)
  @Min(1)
  amount!: number; // cents

  @IsOptional()
  @IsString()
  description?: string;
}

