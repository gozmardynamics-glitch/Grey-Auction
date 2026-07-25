import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlaceBidDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;
}
