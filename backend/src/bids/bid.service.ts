import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bid } from './entities/bid.entity';
import { PlaceBidDto } from './dto/bid.dto';
import { ProductService } from '../products/product.service';
import { AuctionGateway } from './gateways/auction.gateway';

@Injectable()
export class BidService {
  constructor(
    @InjectRepository(Bid)
    private readonly repo: Repository<Bid>,
    private readonly productService: ProductService,
    @Optional() private readonly gateway?: AuctionGateway,
  ) {}

  async placeBid(productId: string, userId: string, dto: PlaceBidDto): Promise<Bid> {
    const product = await this.productService.findById(productId);

    if (dto.amount <= product.currentBid) {
      throw new BadRequestException('Bid must be higher than current bid');
    }

    if (dto.amount < product.startingBid) {
      throw new BadRequestException('Bid must be at least the starting bid');
    }

    // Mark previous winning bid as outbid
    await this.repo.update(
      { productId, isWinningBid: true },
      { isWinningBid: false },
    );

    const bid = this.repo.create({
      productId,
      bidderId: userId,
      amount: dto.amount,
      isWinningBid: true,
    });

    await this.repo.save(bid);
    await this.productService.updateBid(productId, dto.amount);

    this.gateway?.broadcastNewBid(productId, bid);
    this.gateway?.broadcastBidUpdate(productId, {
      currentBid: dto.amount,
      totalBids: bid.product.totalBids,
    });

    return bid;
  }

  async getAuctionBids(productId: string): Promise<Bid[]> {
    return this.repo.find({
      where: { productId },
      relations: ['bidder'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserBids(userId: string): Promise<Bid[]> {
    return this.repo.find({
      where: { bidderId: userId },
      relations: ['product', 'room'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByRoom(roomId: string): Promise<Bid[]> {
    return this.repo.find({
      where: { roomId },
      relations: ['bidder', 'product'],
      order: { createdAt: 'DESC' },
    });
  }
}
