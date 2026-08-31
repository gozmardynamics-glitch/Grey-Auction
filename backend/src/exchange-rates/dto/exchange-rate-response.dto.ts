import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExchangeRatesViewDto {
  @ApiProperty() base: string;
  @ApiProperty({ type: Object, additionalProperties: { type: 'number' } }) rates: Record<string, number>;
  @ApiPropertyOptional() updatedAt?: string | null;
}

export class ExchangeRatesApiResponseDto {
  @ApiProperty() success: boolean;
  @ApiPropertyOptional() message?: string;
  @ApiProperty({ type: ExchangeRatesViewDto }) data: ExchangeRatesViewDto;
}
