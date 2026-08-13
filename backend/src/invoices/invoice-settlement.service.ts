import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Product, ProductStatus } from '../products/entities/product.entity';
import { Bid } from '../bids/entities/bid.entity';
import { FeeService } from '../fees/fee.service';

export interface SettlementResult {
  settled: number;
  skipped: number;
  errors: number;
  details: string[];
}

@Injectable()
export class InvoiceSettlementService {
  private readonly logger = new Logger(InvoiceSettlementService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Bid)
    private readonly bidRepo: Repository<Bid>,
    private readonly feeService: FeeService,
  ) {}

  /**
   * Finds auctions that have ended (endTime < now) but are still active,
   * locates the winning bid for each, and generates invoices.
   * Returns the invoice data for each settled auction (the invoice itself
   * is created via the provided callback to avoid a circular dependency
   * between the invoices and bids modules).
   */
  async findEndedAuctionsToSettle(
    onInvoice: (data: {
      auctionId: string;
      productId: string;
      buyerId: string;
      sellerId: string;
      hammerPrice: number;
      commission: number;
      vat: number;
      fixedFee: number;
    }) => Promise<void>,
  ): Promise<SettlementResult> {
    const result: SettlementResult = { settled: 0, skipped: 0, errors: 0, details: [] };

    const ended = await this.productRepo.find({
      where: {
        endTime: LessThan(new Date()),
        status: In([ProductStatus.ACTIVE, ProductStatus.APPROVED]),
      },
    });

    for (const product of ended) {
      try {
        const winningBid = await this.bidRepo.findOne({
          where: { productId: product.id, isWinningBid: true },
        });

        if (!winningBid) {
          // No bids — just close the auction
          product.status = ProductStatus.CLOSED;
          await this.productRepo.save(product);
          result.skipped++;
          result.details.push(`${product.title}: no winning bid — closed`);
          continue;
        }

        const breakdown = await this.feeService.getBreakdown(
          Number(winningBid.amount),
          product.category,
        );

        await onInvoice({
          auctionId: product.id,
          productId: product.id,
          buyerId: winningBid.bidderId,
          sellerId: product.sellerId,
          hammerPrice: Number(winningBid.amount),
          commission: breakdown.commission,
          vat: breakdown.vatOnBid + breakdown.vatOnCommission,
          fixedFee: breakdown.fixedFee,
        });

        product.status = ProductStatus.SOLD;
        await this.productRepo.save(product);
        result.settled++;
        result.details.push(
          `${product.title}: invoice generated for ${breakdown.total}`,
        );
      } catch (error: any) {
        result.errors++;
        result.details.push(`${product.title}: ERROR — ${error.message}`);
        this.logger.error(`Settlement failed for ${product.id}: ${error.message}`);
      }
    }

    return result;
  }
}
