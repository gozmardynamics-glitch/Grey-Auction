import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertExchangeRateDto {
  @ApiProperty({ description: 'NGN per 1 unit of the currency' })
  @IsNumber()
  @Min(0.000001)
  rate: number;
}
