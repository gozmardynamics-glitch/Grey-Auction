import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

export class DepositDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;
}

export class WithdrawDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'pin must be 4 to 6 digits' })
  pin?: string;

  /** Client-generated idempotency key (5.9): a retried withdraw returns the
    * original transaction instead of debiting twice. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;
}

export class SetPinDto {
  @ApiProperty()
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'pin must be 4 to 6 digits' })
  pin: string;
}
