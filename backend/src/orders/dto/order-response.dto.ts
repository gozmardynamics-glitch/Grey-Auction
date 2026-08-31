import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderResponseDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional() invoiceId?: string;
  @ApiPropertyOptional() auctionId?: string;
  @ApiPropertyOptional() productId?: string;
  @ApiProperty() buyerId: string;
  @ApiProperty() sellerId: string;
  @ApiProperty() total: number;
  @ApiProperty() status: string;
  @ApiPropertyOptional() paymentReference?: string;
  @ApiPropertyOptional() createdAt?: string;
}

export class OrderApiResponseDto {
  @ApiProperty() success: boolean;
  @ApiPropertyOptional() message?: string;
  @ApiProperty({ type: OrderResponseDto }) data: OrderResponseDto;
}

export class OrderListApiResponseDto {
  @ApiProperty() success: boolean;
  @ApiPropertyOptional() message?: string;
  @ApiProperty({ type: [OrderResponseDto] }) data: OrderResponseDto[];
}
