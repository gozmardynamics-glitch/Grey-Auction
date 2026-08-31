import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WalletResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() balance: number;
  @ApiProperty() currency: string;
  @ApiProperty() hasPin: boolean;
  @ApiPropertyOptional() createdAt?: string;
}

export class WalletTransactionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() walletId: string;
  @ApiProperty() type: string;
  @ApiProperty() amount: number;
  @ApiProperty() status: string;
  @ApiPropertyOptional() reference?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() balanceAfter?: number;
  @ApiProperty() createdAt: string;
}

export class DepositResponseDto {
  @ApiProperty() balance: number;
  @ApiProperty({ type: WalletTransactionResponseDto }) transaction: WalletTransactionResponseDto;
  @ApiPropertyOptional() idempotent?: boolean;
}

export class WalletApiResponseDto {
  @ApiProperty() success: boolean;
  @ApiPropertyOptional() message?: string;
  @ApiProperty({ type: WalletResponseDto }) data: WalletResponseDto;
}

export class WalletTransactionsApiResponseDto {
  @ApiProperty() success: boolean;
  @ApiPropertyOptional() message?: string;
  @ApiProperty({ type: [WalletTransactionResponseDto] }) data: WalletTransactionResponseDto[];
}

export class DepositApiResponseDto {
  @ApiProperty() success: boolean;
  @ApiPropertyOptional() message?: string;
  @ApiProperty({ type: DepositResponseDto }) data: DepositResponseDto;
}
