import { Transform } from 'class-transformer';
import { BetStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateBetDto {
  @IsOptional()
  @IsEnum(BetStatus)
  status?: BetStatus;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsInt()
  @Min(0)
  prizeAmount?: number; // cents
}

