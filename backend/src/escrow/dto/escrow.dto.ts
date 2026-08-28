import { IsString, IsNumber, Min, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHoldDto {
  @ApiProperty()
  @IsUUID()
  invoiceId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty()
  @IsUUID()
  sellerId: string;
}

export class RefundDto {
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  reason: string;
}
