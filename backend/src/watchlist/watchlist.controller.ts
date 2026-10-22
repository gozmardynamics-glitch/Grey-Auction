import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WatchlistService } from './watchlist.service';

@ApiTags('Watchlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly service: WatchlistService) {}

  @Get()
  @ApiOperation({ summary: 'Watched lots for the current user (hydrated)' })
  async list(@CurrentUser() user: any) {
    const data = await this.service.listProducts(user.id);
    return { success: true, data };
  }

  @Get('ids')
  @ApiOperation({ summary: 'Watched product ids only (cheap sync for clients)' })
  async ids(@CurrentUser() user: any) {
    const data = await this.service.listIds(user.id);
    return { success: true, data };
  }

  @Post(':productId')
  @ApiOperation({ summary: 'Toggle a lot on/off the watchlist' })
  @ApiParam({ name: 'productId' })
  async toggle(@CurrentUser() user: any, @Param('productId') productId: string) {
    const data = await this.service.toggle(user.id, productId);
    return { success: true, data };
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove a lot from the watchlist' })
  @ApiParam({ name: 'productId' })
  async remove(@CurrentUser() user: any, @Param('productId') productId: string) {
    const data = await this.service.remove(user.id, productId);
    return { success: true, data };
  }
}
