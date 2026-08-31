import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BidApiResponseDto } from './dto/bid-response.dto';
import { BidService } from './bid.service';
import { PlaceBidDto } from './dto/bid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Bids')
@Controller()
export class BidController {
  constructor(private readonly bidService: BidService) {}

  @Post('auctions/:auctionId/bids')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Place a bid on an auction' })
  @ApiParam({ name: 'auctionId' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Bid placed', type: BidApiResponseDto })
  async placeBid(
    @Param('auctionId') auctionId: string,
    @Body() dto: PlaceBidDto,
    @CurrentUser() user: any,
  ) {
    const bid = await this.bidService.placeBid(auctionId, user.id, dto);
    return { success: true, message: 'Bid placed', data: bid };
  }

  @Get('auctions/:auctionId/bids')
  @ApiOperation({ summary: 'Get bids for an auction' })
  @ApiParam({ name: 'auctionId' })
  async getAuctionBids(@Param('auctionId') auctionId: string) {
    const bids = await this.bidService.getAuctionBids(auctionId);
    return { success: true, data: bids };
  }

  @Get('users/:userId/bids')
  @ApiOperation({ summary: 'Get bids by user' })
  async getUserBids(@Param('userId') userId: string) {
    const bids = await this.bidService.getUserBids(userId);
    return { success: true, data: bids };
  }
}