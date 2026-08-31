import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvoiceResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() invoice_number: string;
  @ApiProperty() auction_id: string;
  @ApiProperty() product_id: string;
  @ApiProperty() buyer_id: string;
  @ApiProperty() seller_id: string;
  @ApiProperty() hammer_price: number;
  @ApiProperty() commission: number;
  @ApiProperty() vat: number;
  @ApiProperty() fixed_fee: number;
  @ApiProperty() total: number;
  @ApiProperty() status: string;
  @ApiPropertyOptional() payment_method?: string;
  @ApiPropertyOptional() payment_reference?: string;
  @ApiPropertyOptional() paid_at?: string;
  @ApiPropertyOptional() issued_at?: string;
}

export class InvoiceApiResponseDto {
  @ApiProperty() success: boolean;
  @ApiPropertyOptional() message?: string;
  @ApiProperty({ type: InvoiceResponseDto }) data: InvoiceResponseDto;
}

export class InvoiceListApiResponseDto {
  @ApiProperty() success: boolean;
  @ApiPropertyOptional() message?: string;
  @ApiProperty({ type: [InvoiceResponseDto] }) data: InvoiceResponseDto[];
}
