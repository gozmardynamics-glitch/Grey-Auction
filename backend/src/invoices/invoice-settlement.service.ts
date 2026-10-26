import { Injectable, Inject, Logger, Optional, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/notification.entity';
import { MetricsService } from '../metrics/metrics.service';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, In, Repository } from 'typeorm';
import { Product, ProductStatus } from '../products/entities/product.entity';
import { Bid } from '../bids/entities/bid.entity';
import { FeeService } from '../fees/fee.service';
import { InvoiceService } from './invoice.service';
import { SETTLEMENT_QUEUE, SettlementQueuePort } from './settlement-queue.port';

export interface SettlementResult {
  settled: number;
  skipped: number;
  errors: number;
  details: string[];
}

type SettlementOutcome =
  | {
      kind: 'settled';
      detail: string;
      buyerId: string;
      sellerId: string;
      title: string;
      slug: string | null;
      id: string;
      hammerPrice: number;
    }
  | {
      kind: 'awaiting-seller-approval';
      detail: string;
      buyerId: string;
      sellerId: string;
      title: string;
      slug: string | null;
      id: string;
      hammerPrice: number;
    }
  | { kind: 'no-bid' | 'skip'; detail: string }
  | { kind: 'reserve-not-met'; detail: string; sellerId: string; title: string };

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
    @Optional()
    @Inject(SETTLEMENT_QUEUE)
    private readonly queue?: SettlementQueuePort,
    @Optional() private readonly notifications?: NotificationService,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  /**
   * Finds auctions that ended but are still ACTIVE/APPROVED and settles each one.
   *
   * When a queue implementation is registered and reachable, one job per lot is
   * enqueued so the worker can retry with backoff. Otherwise each lot is settled
   * inline in this tick — a missing Redis must never stall settlement.
   */
  async settleEndedAuctions(): Promise<SettlementResult> {
    const result: SettlementResult = { settled: 0, skipped: 0, errors: 0, details: [] };

    const ended = await this.productRepo.find({
      where: {
        endTime: LessThan(new Date()),
        status: In([ProductStatus.ACTIVE, ProductStatus.APPROVED]),
      },
    });

    if (ended.length === 0) return result;

    const queueAvailable = this.queue ? await this.queue.isReady(2000) : false;
    if (!queueAvailable) {
      this.logger.log('No settlement queue available — settling inline this tick');
      this.metrics?.incrementInlineSettlement();
    }

    for (const product of ended) {
      if (queueAvailable) {
        try {
          await this.queue!.enqueue(product.id);
          result.settled++;
          result.details.push(product.title + ': queued for settlement');
          continue;
        } catch (error: any) {
          this.logger.error(
            'Failed to queue settlement for ' + product.id + ': ' + error.message,
          );
        }
      }

      try {
        const outcome = await this.settleProduct(product.id);
        this.applyOutcome(result, outcome);
      } catch (error: any) {
        result.errors++;
        result.details.push(product.title + ': ERROR — ' + error.message);
        this.logger.error('Settlement failed for ' + product.id + ': ' + error.message);
      }
    }

    return result;
  }

  private applyOutcome(result: SettlementResult, outcome: SettlementOutcome): void {
    if (outcome.kind === 'settled') {
      result.settled++;
      result.details.push(outcome.detail);

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
      return;
    }

    result.skipped++;
    result.details.push(outcome.detail);

    // Tell the seller their reserve was not met so they can relist.
    if (outcome.kind === 'reserve-not-met' && this.notifications) {
      void this.notifications
        .notifyAuctionEnded(outcome.sellerId, {
          auctionTitle: outcome.title ?? 'the auction',
          auctionId: '',
          link: '/seller/auctions',
        })
        .catch(() => undefined);
    }

    // Decision 3b — the lot closed below the seller's approval threshold (or
    // with approval required and no threshold): ask the seller to accept or
    // decline. The buyer hears nothing until the seller decides.
    if (outcome.kind === 'awaiting-seller-approval' && this.notifications) {
      void this.notifications
        .notifySellerApprovalRequested(outcome.sellerId, {
          auctionTitle: outcome.title ?? 'the auction',
          auctionId: outcome.id,
          hammerPrice: outcome.hammerPrice,
          link: '/seller/auctions',
        })
        .catch(() => undefined);
    }
  }

  /**
   * Settles a single product in its own transaction. A pessimistic lock plus a
   * status re-check keeps a concurrent run (cron tick vs queue worker) from
   * double-invoicing the same lot.
   *
   * Returns the outcome so the caller can tally it; the queue worker ignores it.
   */
  async settleProduct(productId: string): Promise<SettlementOutcome> {
    return this.dataSource.transaction<SettlementOutcome>(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const bidRepo = manager.getRepository(Bid);

      const locked = await productRepo.findOne({
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked) {
        return { kind: 'skip', detail: 'missing — skipped' };
      }
      if (![ProductStatus.ACTIVE, ProductStatus.APPROVED].includes(locked.status)) {
        return { kind: 'skip', detail: locked.title + ': already settled — skipped' };
      }

      const winningBid = await bidRepo.findOne({
        where: { productId: locked.id, isWinningBid: true },
      });
      if (!winningBid) {
        locked.status = ProductStatus.CLOSED;
        await productRepo.save(locked);
        return { kind: 'no-bid', detail: locked.title + ': no winning bid — closed' };
      }

      // U5: override-aware fee resolution (product -> seller -> buyer -> category -> default)
      const breakdown = await this.feeService.resolveAndCompute(
        Number(winningBid.amount),
        {
          category: locked.category,
          sellerId: locked.sellerId,
          productId: locked.id,
          buyerId: winningBid.bidderId,
        },
      );

      // R2: a reserve price is a hard floor. A winning bid below it must not be
      // invoiced — close the lot unsold so the seller is never forced to sell
      // under their stated minimum.
      const reserve = Number(locked.reservePrice);
      const hasReserve =
        locked.hasReservePrice === true &&
        locked.reservePrice != null &&
        Number.isFinite(reserve) &&
        reserve > 0;
      if (hasReserve && Number(winningBid.amount) < reserve) {
        locked.status = ProductStatus.CLOSED;
        await productRepo.save(locked);
        return {
          kind: 'reserve-not-met',
          detail:
            locked.title +
            ': reserve not met (' +
            winningBid.amount +
            ' < ' +
            reserve +
            ') — closed unsold',
          sellerId: locked.sellerId,
          title: locked.title,
        };
      }

      // Decision 3b — "final bid subject to seller approval". When the lot is
      // flagged, a winning bid below approvalThreshold (or any winning bid when
      // no threshold is set) waits for the seller instead of auto-invoicing.
      const threshold = Number(locked.approvalThreshold);
      const needsApproval =
        locked.requiresSellerApproval === true &&
        (!Number.isFinite(threshold) || Number(winningBid.amount) < threshold);
      if (needsApproval) {
        locked.status = ProductStatus.AWAITING_SELLER_APPROVAL;
        locked.approvalRequestedAt = new Date();
        await productRepo.save(locked);
        return {
          kind: 'awaiting-seller-approval',
          detail:
            locked.title +
            ': winning bid ' +
            winningBid.amount +
            ' awaits seller approval (threshold ' +
            (Number.isFinite(threshold) ? threshold : 'none') +
            ')',
          buyerId: winningBid.bidderId,
          sellerId: locked.sellerId,
          title: locked.title,
          slug: locked.slug ?? null,
          id: locked.id,
          hammerPrice: Number(winningBid.amount),
        };
      }

      await this.invoiceService.createInvoice(manager, {
        auctionId: locked.id,
        productId: locked.id,
        buyerId: winningBid.bidderId,
        sellerId: locked.sellerId,
        hammerPrice: Number(winningBid.amount),
        commission: breakdown.buyerFee,
        vat: breakdown.vatOnBid + breakdown.vatOnBuyerFee,
        fixedFee: breakdown.fixedFee,
        otherCharges: breakdown.otherCharges,
        sellerFee: breakdown.sellerFee,
        feeSource: breakdown.source,
        vatBase: breakdown.vatBase,
        escrowWindowHours: locked.escrowReleaseHours ?? 72,
      });

      locked.status = ProductStatus.SOLD;
      locked.approvalRequestedAt = null;
      await productRepo.save(locked);

      return {
        kind: 'settled',
        detail: locked.title + ': invoice generated for ' + breakdown.total,
        buyerId: winningBid.bidderId,
        sellerId: locked.sellerId,
        title: locked.title,
        slug: locked.slug ?? null,
        id: locked.id,
        hammerPrice: Number(winningBid.amount),
      };
    });
  }

  /**
   * Decision 3b — expire lots whose seller never answered.
   *
   * A lot parked in awaiting_seller_approval used to wait forever, leaving the
   * winning bidder in limbo and the lot unbillable. After
   * SELLER_APPROVAL_WINDOW_HOURS (default 72) the sweep declines on the
   * seller's behalf, closes the lot and tells both sides. Returns how many lots
   * were expired.
   */
  async expirePendingApprovals(now = new Date()): Promise<number> {
    const windowHours = Number(process.env.SELLER_APPROVAL_WINDOW_HOURS ?? 72);
    const cutoff = new Date(
      now.getTime() - (Number.isFinite(windowHours) ? windowHours : 72) * 3600_000,
    );

    const stale = await this.productRepo.find({
      where: {
        status: ProductStatus.AWAITING_SELLER_APPROVAL,
        approvalRequestedAt: LessThan(cutoff),
      },
      take: 100,
    });

    let expired = 0;
    for (const product of stale) {
      try {
        const didExpire = await this.dataSource.transaction(async (manager) => {
          const repo = manager.getRepository(Product);
          const locked = await repo.findOne({
            where: { id: product.id },
            lock: { mode: 'pessimistic_write' },
          });
          // Re-check under the lock: the seller may have decided meanwhile.
          if (
            !locked ||
            locked.status !== ProductStatus.AWAITING_SELLER_APPROVAL ||
            !locked.approvalRequestedAt ||
            locked.approvalRequestedAt >= cutoff
          ) {
            return false;
          }

          const winningBid = await manager.getRepository(Bid).findOne({
            where: { productId: locked.id, isWinningBid: true },
          });

          locked.status = ProductStatus.CLOSED;
          locked.approvalRequestedAt = null;
          await repo.save(locked);

          if (this.notifications) {
            const link = locked.slug ? '/auctions/' + locked.slug : '/auctions/' + locked.id;
            if (winningBid) {
              void this.notifications
                .notifySaleDeclined(winningBid.bidderId, {
                  auctionTitle: locked.title,
                  auctionId: locked.id,
                  hammerPrice: Number(winningBid.amount),
                  link,
                  reason: `The seller of “${locked.title}” did not approve the winning bid in time. No payment is owed.`,
                })
                .catch(() => undefined);
            }
            void this.notifications
              .create(locked.sellerId, {
                type: NotificationType.SYSTEM,
                title: 'A winning bid expired unapproved',
                body: `“${locked.title}” closed but was not approved within ${windowHours} hours, so the sale was cancelled. You can relist the lot.`,
                link: '/seller/auctions',
              })
              .catch(() => undefined);
          }
          return true;
        });
        if (didExpire) expired += 1;
      } catch (error: any) {
        this.logger.warn(
          'Approval expiry failed for ' + product.id + ': ' + (error?.message ?? error),
        );
      }
    }

    if (expired > 0) {
      this.logger.log('Expired ' + expired + ' unapproved winning bid(s)');
    }
    return expired;
  }

  /**
   * Decision 3b — the seller accepts or declines the winning bid of a lot that
   * closed in AWAITING_SELLER_APPROVAL.
   *
   * Accept  → re-resolve fees at decision time and issue the invoice (the same
   *           settlement tail as an auto-settled lot), then notify the buyer.
   * Decline → close the lot unsold and tell the buyer no payment is owed.
   *
   * Ownership is verified against products.sellerId (the owner's user id); a
   * lot that is not awaiting approval is rejected rather than guessed about.
   */
  async decideSale(
    productId: string,
    sellerUserId: string,
    decision: 'accept' | 'decline',
  ): Promise<Product> {
    return this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const locked = await productRepo.findOne({
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked) throw new NotFoundException('Lot not found');
      if (locked.sellerId !== sellerUserId) {
        throw new ForbiddenException('Not your lot');
      }
      if (locked.status !== ProductStatus.AWAITING_SELLER_APPROVAL) {
        throw new BadRequestException(
          'This lot is not awaiting seller approval (status: ' + locked.status + ')',
        );
      }

      const winningBid = await manager.getRepository(Bid).findOne({
        where: { productId: locked.id, isWinningBid: true },
      });
      if (!winningBid) {
        // Should not happen (settlement parks the lot only with a winner), but
        // never leave a lot stuck: close it.
        locked.status = ProductStatus.CLOSED;
        await productRepo.save(locked);
        throw new BadRequestException('No winning bid found — lot closed');
      }

      if (decision === 'decline') {
        locked.status = ProductStatus.CLOSED;
        locked.approvalRequestedAt = null;
        await productRepo.save(locked);
        if (this.notifications) {
          void this.notifications
            .notifySaleDeclined(winningBid.bidderId, {
              auctionTitle: locked.title,
              auctionId: locked.id,
              hammerPrice: Number(winningBid.amount),
              link: locked.slug ? '/auctions/' + locked.slug : '/auctions/' + locked.id,
            })
            .catch(() => undefined);
        }
        return locked;
      }

      const breakdown = await this.feeService.resolveAndCompute(
        Number(winningBid.amount),
        {
          category: locked.category,
          sellerId: locked.sellerId,
          productId: locked.id,
          buyerId: winningBid.bidderId,
        },
      );

      await this.invoiceService.createInvoice(manager, {
        auctionId: locked.id,
        productId: locked.id,
        buyerId: winningBid.bidderId,
        sellerId: locked.sellerId,
        hammerPrice: Number(winningBid.amount),
        commission: breakdown.buyerFee,
        vat: breakdown.vatOnBid + breakdown.vatOnBuyerFee,
        fixedFee: breakdown.fixedFee,
        otherCharges: breakdown.otherCharges,
        sellerFee: breakdown.sellerFee,
        feeSource: breakdown.source,
        vatBase: breakdown.vatBase,
        escrowWindowHours: locked.escrowReleaseHours ?? 72,
      });

      locked.status = ProductStatus.SOLD;
      locked.approvalRequestedAt = null;
      await productRepo.save(locked);

      if (this.notifications) {
        const link = locked.slug ? '/auctions/' + locked.slug : '/auctions/' + locked.id;
        void this.notifications
          .notifyAuctionWon(winningBid.bidderId, {
            auctionTitle: locked.title,
            auctionId: locked.id,
            hammerPrice: Number(winningBid.amount),
            link,
          })
          .catch(() => undefined);
      }
      return locked;
    });
  }
}
