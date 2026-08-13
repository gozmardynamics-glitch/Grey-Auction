import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeeService, UpsertFeeDto } from './fee.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Fees')
@Controller('fees')
export class FeeController {
  constructor(private readonly feeService: FeeService) {}

  @Get()
  @ApiOperation({ summary: 'List all fee configurations' })
  async findAll() {
    const data = await this.feeService.findAll();
    return { success: true, data };
  }

  @Get('breakdown')
  @ApiOperation({ summary: 'Compute price breakdown for a bid amount' })
  async breakdown(
    @Query('amount') amount: string,
    @Query('category') category?: string,
  ) {
    const parsedAmount = parseFloat(amount || '0');
    const data = await this.feeService.getBreakdown(parsedAmount, category);
    return { success: true, data };
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get fee configuration for a category' })
  async byCategory(@Param('category') category: string) {
    const data = await this.feeService.findByCategory(category);
    return { success: true, data };
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update a fee configuration (Admin)' })
  async upsert(@Body() dto: UpsertFeeDto) {
    const data = await this.feeService.upsert(dto);
    return { success: true, message: 'Fee configuration saved', data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a fee configuration (Admin)' })
  async remove(@Param('id') id: string) {
    await this.feeService.remove(id);
    return { success: true, message: 'Fee configuration deleted' };
  }
}
