import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WalletApiResponseDto, WalletTransactionsApiResponseDto, DepositApiResponseDto } from './dto/wallet-response.dto';
import { DepositDto, WithdrawDto, SetPinDto } from './dto/wallet.dto';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user wallet' })
  @ApiResponse({ status: 200, description: 'Wallet', type: WalletApiResponseDto })
  async getWallet(@CurrentUser() user: any) {
    return { success: true, data: await this.walletService.getWallet(user.id) };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get wallet transactions' })
  @ApiResponse({ status: 200, description: 'Transactions', type: WalletTransactionsApiResponseDto })
  async getTransactions(@CurrentUser() user: any) {
    return { success: true, data: await this.walletService.getTransactions(user.id) };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('deposit')
  @ApiOperation({ summary: 'Deposit funds (mock settlement)' })
  @ApiResponse({ status: 201, description: 'Deposit result', type: DepositApiResponseDto })
  async deposit(@CurrentUser() user: any, @Body() dto: DepositDto) {
    return { success: true, data: await this.walletService.deposit(user.id, dto) };
  }

  // A 4-6 digit wallet PIN is guessable at speed: bound the attempts per IP.
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw funds' })
  async withdraw(@CurrentUser() user: any, @Body() dto: WithdrawDto) {
    return { success: true, data: await this.walletService.withdraw(user.id, dto) };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('pin')
  @ApiOperation({ summary: 'Set or change the wallet PIN' })
  async setPin(@CurrentUser() user: any, @Body() dto: SetPinDto) {
    return { success: true, data: await this.walletService.setPin(user.id, dto.pin) };
  }
}