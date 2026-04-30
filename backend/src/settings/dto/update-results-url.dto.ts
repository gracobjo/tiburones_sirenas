import { IsString, IsUrl } from 'class-validator';

export class UpdateResultsUrlDto {
  @IsString()
  @IsUrl({ require_protocol: true })
  url!: string;
}

