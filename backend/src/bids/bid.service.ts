import { Injectable, NotFoundException, BadRequestException, Optional, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Bid } from './entities/bid.entity';
import { PlaceBidDto } from './dto/bid.dto';
import { Product, ProductStatus } from '../products/entities/product.entity';
import { ProductService } from '../products/product.service';
import { AuctionGateway } from './gateways/auction.gateway';
import { NotificationService } from '../notification/notification.service';
import { Seller } from '../seller/entities/seller.entity';
import { WalletService } from '../wallet/wallet.service';

// ─── Auction engine constants ──────────────────────────────────────────
// Minimum increment per current-bid level (NGN).
export function bidStep(currentBid: number): number {
  if (currentBid < 10000) return 500;
  if (currentBid < 50000) return 1000;
  if (currentBid < 100000) return 2500;
  if (currentBid < 500000) return 5000;
  if (currentBid < 1000000) return 10000;
  if (currentBid < 5000000) return 25000;
  if (currentBid < 10000000) return 50000;
  return 100000;
}

export const ANTI_SNIPE_WINDOW_MS = 2 * 60 * 1000; // extend when < 2 min left
export const ANTI_SNIPE_EXTEND_MS = 2 * 60 * 1000; // extend by 2 min

export interface AutoBidCandidate {
  bidderId: string;
  maxBid: number;
}

export interface ResolvedAutoBid {
  bidderId: string;
  amount: number;
  /** The bidder's proxy ceiling (their original max bid). */
  maxBid: number;
}

/**
 * Pure proxy-bidding resolver.
 *
 * Given the current price, the current leading bidder and every bidder's
 * auto-bid ceiling, computes the incremental auto-bids that should be
 * placed so the highest ceiling wins at the second-highest ceiling + one
 * increment (or one increment over the current manual price).
 */
export function resolveAutoBids(
  currentBid: number,
  currentWinnerId: string,
  candidates: AutoBidCandidate[],
  maxRounds = 50,
): ResolvedAutoBid[] {
  const bids: ResolvedAutoBid[] = [];
  let price = currentBid;
  let winner = currentWinnerId;

  for (let i = 0; i < maxRounds; i += 1) {
    const active = candidates
      .filter((c) => c.maxBid > price)
      .sort((a, b) => b.maxBid - a.maxBid);

    if (active.length === 0) break;
    const highest = active[0];
    const second = active[1];

    let target: number;
    if (second) {
      target = Math.min(highest.maxBid, second.maxBid + bidStep(price));
    } else if (highest.bidderId === winner) {
      // Already winning with no competitor left — stop.
      break;
    } else {
      // Outbid the current (manual) winner by one increment.
      target = Math.min(highest.maxBid, price + bidStep(price));
    }

    if (target <= price) break;
    price = target;
    winner = highest.bidderId;
    bids.push({
      bidderId: highest.bidderId,
      amount: price,
      maxBid: highest.maxBid,
    });
  }

  return bids;
}

@Injectable()
export class BidService {
  constructor(
    @InjectRepository(Bid)
    private readonly repo: Repository<Bid>,
    private readonly productService: ProductService,
    @Optional() private readonly gateway?: AuctionGateway,
    @Inject(DataSource) private readonly dataSource?: DataSource,
    @Optional() private readonly notifications?: NotificationService,
    @InjectRepository(Seller)
    @Optional() private readonly sellerRepository?: Repository<Seller>,
    @Optional() private readonly walletService?: WalletService,
  ) {}

  async placeBid(productId: string, userId: string, dto: PlaceBidDto): Promise<Bid> {
    const placed: Bid[] = [];
    // Bidders displaced from the leading slot during this bid action.
    const displaced = new Set<string>();
    let productTitle: string | undefined;

    const result = await this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }
      productTitle = product.title;

      if (dto.amount <= product.currentBid) {
        throw new BadRequestException('Bid must be higher than current bid');
      }

      if (dto.amount < product.startingBid) {
        throw new BadRequestException('Bid must be at least the starting bid');
      }

      // ─── Seller-required minimum bid deposit gate (conditional) ──
      // If the seller requires wallet funding, the bidder must hold at least
      // the configured minimum deposit in their wallet before they can bid.
      if (this.sellerRepository && this.walletService) {
        const seller = await this.sellerRepository.findOne({
          where: { user_id: product.sellerId, deleted_at: null },
        });
        if (seller?.require_minimum_bid_deposit) {
          const minDeposit = Number(seller.minimum_bid_deposit || 0);
          if (minDeposit > 0) {
            const wallet = await this.walletService.getWallet(userId);
            if (Number(wallet.balance) < minDeposit) {
              throw new BadRequestException(
                'This auction requires a minimum wallet deposit of ' +
                  minDeposit.toLocaleString('en-NG') +
                  ' NGN to bid. Please fund your wallet.',
              );
            }
          }
        }
      }

      // ─── Anti-sniping: extend the auction when a bid arrives late ──
      if (
        product.status === ProductStatus.ACTIVE &&
        product.endTime.getTime() - Date.now() < ANTI_SNIPE_WINDOW_MS
      ) {
        product.endTime = new Date(
          product.endTime.getTime() + ANTI_SNIPE_EXTEND_MS,
        );
      }

      const placeOne = async (
        bidderId: string,
        amount: number,
        isAutoBid: boolean,
        maxBid: number | null,
      ) => {
        const currentLeader = await manager.findOne(Bid, {
          where: { productId, isWinningBid: true },
        });
        if (currentLeader && currentLeader.bidderId !== bidderId) {
          displaced.add(currentLeader.bidderId);
        }
        await manager.update(
          Bid,
          { productId, isWinningBid: true },
          { isWinningBid: false },
        );
        const row = manager.create(Bid, {
          productId,
          bidderId,
          amount,
          isAutoBid,
          maxBid,
          isWinningBid: true,
        });
        await manager.save(row);
        product.currentBid = amount;
        product.totalBids = product.totalBids + 1;
        placed.push(row);
        return row;
      };

      // 1. Place the manual bid
      await placeOne(userId, dto.amount, false, dto.maxBid ?? null);

      // 2. Resolve proxy/auto-bids from every bidder's ceilings
      if (dto.maxBid !== undefined) {
        const rows: { bidderId: string; maxBid: string }[] =
          await manager
            .createQueryBuilder(Bid, 'b')
            .select('b.bidderId', 'bidderId')
            .addSelect('MAX(b.maxBid)', 'maxBid')
            .where('b.productId = :productId', { productId })
            .andWhere('b.maxBid IS NOT NULL')
            .andWhere('b.maxBid > :amount', { amount: dto.amount })
            .groupBy('b.bidderId')
            .getRawMany();

        const candidates = rows.map((r) => ({
          bidderId: r.bidderId,
          maxBid: Number(r.maxBid),
        }));

        const resolved = resolveAutoBids(
          dto.amount,
          userId,
          candidates,
        );

        for (const auto of resolved) {
          await placeOne(auto.bidderId, auto.amount, true, auto.maxBid);
        }
      }

      await manager.save(product);

      for (const bid of placed) {
        this.gateway?.broadcastNewBid(productId, bid);
      }
      this.gateway?.broadcastBidUpdate(productId, {
        currentBid: product.currentBid,
        totalBids: product.totalBids,
      });

      return placed[0];
    });

    // ─── Post-commit: notify every displaced bidder they've been outbid ──
    const finalWinnerId = placed[placed.length - 1]?.bidderId;
    if (this.notifications) {
      const link = '/auctions/' + productId;
      for (const outbidUserId of displaced) {
        if (!outbidUserId || outbidUserId === finalWinnerId) continue;
        void this.notifications
          .notifyOutbid(outbidUserId, {
            auctionTitle: productTitle ?? 'the auction',
            auctionId: productId,
            link,
          })
          .catch(() => undefined);
      }
    }

    return result;
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
      take: 100,
    });
  }

  async findByRoom(roomId: string): Promise<Bid[]> {
    return this.repo.find({
      where: { roomId },
      relations: ['bidder', 'product'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
