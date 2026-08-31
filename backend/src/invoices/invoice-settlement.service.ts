import { Injectable, Logger, Optional } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, In, Repository } from 'typeorm';
import { Product, ProductStatus } from '../products/entities/product.entity';
import { Bid } from '../bids/entities/bid.entity';
import { FeeService } from '../fees/fee.service';
import { InvoiceService } from './invoice.service';

export interface SettlementResult {
  settled: number;
  skipped: number;
  errors: number;
  details: string[];
}

type SettlementOutcome =
  | { kind: 'settled'; detail: string; buyerId: string; sellerId: string; title: string; slug: string | null; id: string; hammerPrice: number }
  | { kind: 'no-bid' | 'skip'; detail: string };

@Injectable()
export class InvoiceSettlementService {
  private readonly logger = new Logger(InvoiceSettlementService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Bid)
    private readonly bidRepo: Repository<Bid>,
    private readonly feeService: FeeService,
    private readonly invoiceService: InvoiceService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Optional() private readonly notifications?: NotificationService,
  ) {}

  /**
   * Finds auctions that have ended (endTime < now) but are still active, then
   * settles each in its own DB transaction: the invoice is issued and the lot is
   * marked SOLD atomically (a pessimistic lock + status re-check prevents a
   * concurrent run from double-invoicing the same lot).
   */
  async settleEndedAuctions(): Promise<SettlementResult> {
    const result: SettlementResult = { settled: 0, skipped: 0, errors: 0, details: [] };

    const ended = await this.productRepo.find({
      where: {
        endTime: LessThan(new Date()),
        status: In([ProductStatus.ACTIVE, ProductStatus.APPROVED]),
      },
    });

    for (const product of ended) {
      try {
        const outcome = await this.dataSource.transaction<SettlementOutcome>(
          async (manager) => {
            const productRepo = manager.getRepository(Product);
            const bidRepo = manager.getRepository(Bid);

            const locked = await productRepo.findOne({
              where: { id: product.id },
              lock: { mode: 'pessimistic_write' },
            });
            if (!locked) {
              return { kind: 'skip', detail: product.title + ': missing — skipped' };
            }
            if (![ProductStatus.ACTIVE, ProductStatus.APPROVED].includes(locked.status)) {
              return { kind: 'skip', detail: product.title + ': already settled — skipped' };
            }

            const winningBid = await bidRepo.findOne({
              where: { productId: locked.id, isWinningBid: true },
            });
            if (!winningBid) {
              locked.status = ProductStatus.CLOSED;
              await productRepo.save(locked);
              return { kind: 'no-bid', detail: product.title + ': no winning bid — closed' };
            }

            const breakdown = await this.feeService.getBreakdown(
              Number(winningBid.amount),
              locked.category,
            );

            await this.invoiceService.createInvoice(manager, {
              auctionId: locked.id,
              productId: locked.id,
              buyerId: winningBid.bidderId,
              sellerId: locked.sellerId,
              hammerPrice: Number(winningBid.amount),
              commission: breakdown.commission,
              vat: breakdown.vatOnBid + breakdown.vatOnCommission,
              fixedFee: breakdown.fixedFee,
            });

            locked.status = ProductStatus.SOLD;
            await productRepo.save(locked);

            return {
              kind: 'settled',
              detail: product.title + ': invoice generated for ' + breakdown.total,
              buyerId: winningBid.bidderId,
              sellerId: locked.sellerId,
              title: locked.title,
              slug: locked.slug ?? null,
              id: locked.id,
              hammerPrice: Number(winningBid.amount),
            };
          },
        );

        if (outcome.kind === 'settled') {
          result.settled++;
          result.details.push(outcome.detail);

          // Notify the winner and the seller after the transaction has committed.
          if (this.notifications) {
            const auctionTitle = outcome.title ?? 'the auction';
            const link = '/auctions/' + (outcome.slug ?? outcome.id);
            void this.notifications
              .notifyAuctionWon(outcome.buyerId, {
                auctionTitle,
                auctionId: outcome.id,
                hammerPrice: outcome.hammerPrice,
                link,
              })
              .catch(() => undefined);
            void this.notifications
              .notifyAuctionEnded(outcome.sellerId, {
                auctionTitle,
                auctionId: outcome.id,
                link,
              })
              .catch(() => undefined);
          }
        } else {
          result.skipped++;
          result.details.push(outcome.detail);
        }
      } catch (error: any) {
        result.errors++;
        result.details.push(product.title + ': ERROR — ' + error.message);
        this.logger.error('Settlement failed for ' + product.id + ': ' + error.message);
      }
    }

    return result;
  }
}
