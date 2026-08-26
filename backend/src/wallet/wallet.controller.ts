import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
  async getWallet(@CurrentUser() user: any) {
    return { success: true, data: await this.walletService.getWallet(user.id) };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get wallet transactions' })
  async getTransactions(@CurrentUser() user: any) {
    return { success: true, data: await this.walletService.getTransactions(user.id) };
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Deposit funds (mock settlement)' })
  async deposit(@CurrentUser() user: any, @Body() dto: { amount: number; reference?: string }) {
    return { success: true, data: await this.walletService.deposit(user.id, dto) };
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw funds' })
  async withdraw(@CurrentUser() user: any, @Body() dto: { amount: number; pin?: string }) {
    return { success: true, data: await this.walletService.withdraw(user.id, dto) };
  }

  @Post('pin')
  @ApiOperation({ summary: 'Set or change the wallet PIN' })
  async setPin(@CurrentUser() user: any, @Body() dto: { pin: string }) {
    return { success: true, data: await this.walletService.setPin(user.id, dto.pin) };
  }
}
