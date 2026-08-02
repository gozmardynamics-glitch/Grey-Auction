import { Injectable, NotFoundException, BadRequestException, Optional, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Bid } from './entities/bid.entity';
import { PlaceBidDto } from './dto/bid.dto';
import { Product } from '../products/entities/product.entity';
import { ProductService } from '../products/product.service';
import { AuctionGateway } from './gateways/auction.gateway';

@Injectable()
export class BidService {
  constructor(
    @InjectRepository(Bid)
    private readonly repo: Repository<Bid>,
    private readonly productService: ProductService,
    @Optional() private readonly gateway?: AuctionGateway,
    @Inject(DataSource) private readonly dataSource?: DataSource,
  ) {}

  async placeBid(productId: string, userId: string, dto: PlaceBidDto): Promise<Bid> {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (dto.amount <= product.currentBid) {
        throw new BadRequestException('Bid must be higher than current bid');
      }

      if (dto.amount < product.startingBid) {
        throw new BadRequestException('Bid must be at least the starting bid');
      }

      await manager.update(Bid, { productId, isWinningBid: true }, { isWinningBid: false });

      const bid = manager.create(Bid, {
        productId,
        bidderId: userId,
        amount: dto.amount,
        isWinningBid: true,
      });

      await manager.save(bid);

      product.currentBid = dto.amount;
      product.totalBids = product.totalBids + 1;
      await manager.save(product);

      this.gateway?.broadcastNewBid(productId, bid);
      this.gateway?.broadcastBidUpdate(productId, {
        currentBid: dto.amount,
        totalBids: product.totalBids,
      });

      return bid;
    });
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
