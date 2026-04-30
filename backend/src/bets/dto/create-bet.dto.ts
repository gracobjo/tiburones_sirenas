import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateBetDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsInt()
  @Min(1)
  amount!: number; // cents

  @IsString()
  betCode!: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}

