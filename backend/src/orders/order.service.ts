import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { Invoice, InvoiceStatus } from '../invoices/invoice.entity';
import { InvoiceService } from '../invoices/invoice.service';
import { FeeService } from '../fees/fee.service';
import { Product, AuctionType } from '../products/entities/product.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly feeService: FeeService,
    private readonly invoiceService: InvoiceService,
  ) {}

  /**
   * U5 answer #7 — direct sales (buy-now) go through the same fee rules as
   * auctions: the override-aware breakdown is computed and an invoice is
   * issued from the buy-now price. Idempotent per product while unpaid.
   */
  async createForBuyNow(productId: string, buyerId: string): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const product = await productRepo.findOne({
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) throw new NotFoundException('Product not found');
      if (product.auctionType !== AuctionType.DIRECT_SALE || !product.allowBuyNow) {
        throw new BadRequestException('This lot is not a direct sale');
      }
      if (!product.buyNowPrice || Number(product.buyNowPrice) <= 0) {
        throw new BadRequestException('Direct sale has no buy-now price');
      }

      // One open invoice per direct-sale lot at a time.
      const invoiceRepo = manager.getRepository(Invoice);
      const existing = await invoiceRepo.findOne({
        where: { product_id: productId, status: InvoiceStatus.ISSUED },
      });
      if (existing) {
        if (existing.buyer_id !== buyerId) {
          throw new BadRequestException('Another buyer already started this purchase');
        }
        const dup = await this.orderRepo.findOne({ where: { invoiceId: existing.id } });
        if (dup) return dup;
        return this.orderRepo.save(this.orderRepo.create(this.toOrder(existing)));
      }

      const hammer = Number(product.buyNowPrice);
      const breakdown = await this.feeService.resolveAndCompute(hammer, {
        category: product.category,
        sellerId: product.sellerId,
        productId: product.id,
      });

      const invoice = await this.invoiceService.createInvoice(manager, {
        auctionId: product.id,
        productId: product.id,
        buyerId,
        sellerId: product.sellerId,
        hammerPrice: hammer,
        commission: breakdown.buyerFee,
        vat: breakdown.vatOnBid + breakdown.vatOnBuyerFee,
        fixedFee: breakdown.fixedFee,
        sellerFee: breakdown.sellerFee,
        feeSource: breakdown.source,
        vatBase: breakdown.vatBase,
        escrowWindowHours: product.escrowReleaseHours ?? 72,
      });

      return this.orderRepo.save(this.orderRepo.create(this.toOrder(invoice)));
    });
  }

  /**
   * Create an order for the buyer from an invoice (idempotent: one order per
   * invoice). Runs in a transaction with a lock on the invoice so concurrent
   * checkouts can't double-create. The order starts PAID when the invoice is
   * already paid, otherwise PENDING (it is flipped to PAID by the webhook seam).
   */
  async createFromInvoice(invoiceId: string, buyerId: string): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const invoiceRepo = manager.getRepository(Invoice);
      const invoice = await invoiceRepo.findOne({
        where: { id: invoiceId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!invoice) throw new NotFoundException('Invoice not found');
      if (invoice.buyer_id !== buyerId) {
        throw new ForbiddenException('This invoice does not belong to you');
      }
      if (invoice.status === InvoiceStatus.CANCELLED) {
        throw new BadRequestException('Cannot order from a cancelled invoice');
      }

      const orderRepo = manager.getRepository(Order);
      const existing = await orderRepo.findOne({ where: { invoiceId } });
      if (existing) return existing;

      return orderRepo.save(orderRepo.create(this.toOrder(invoice)));
    });
  }

  /**
   * Mark an order paid within a caller-supplied transaction (the payment
   * webhook seam). Creates a paid order if none exists yet for the invoice, so
   * the order commits or rolls back with the invoice + payment status flip.
   */
  async markPaidInManager(
    manager: EntityManager,
    invoiceId: string,
    paymentReference?: string,
  ): Promise<Order> {
    const orderRepo = manager.getRepository(Order);
    let order = await orderRepo.findOne({
      where: { invoiceId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!order) {
      const invoice = await manager.getRepository(Invoice).findOne({ where: { id: invoiceId } });
      if (!invoice) throw new NotFoundException('Invoice not found');
      order = orderRepo.create(this.toOrder(invoice));
    }

    order.status = OrderStatus.PAID;
    if (paymentReference) order.paymentReference = paymentReference;
    return orderRepo.save(order);
  }

  async findById(id: string, viewerId?: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (viewerId && order.buyerId !== viewerId && order.sellerId !== viewerId) {
      throw new ForbiddenException('Not your order');
    }
    return order;
  }

  async findByInvoice(invoiceId: string): Promise<Order | null> {
    return this.orderRepo.findOne({ where: { invoiceId } });
  }

  async listByUser(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: [{ buyerId: userId }, { sellerId: userId }],
      order: { createdAt: 'DESC' },
    });
  }

  /** Map an invoice to the order row (status mirrors the invoice payment state). */
  private toOrder(invoice: Invoice): Partial<Order> {
    return {
      invoiceId: invoice.id,
      auctionId: invoice.auction_id,
      productId: invoice.product_id,
      buyerId: invoice.buyer_id,
      sellerId: invoice.seller_id,
      total: Number(invoice.total),
      status: invoice.status === InvoiceStatus.PAID ? OrderStatus.PAID : OrderStatus.PENDING,
      paymentReference: invoice.payment_reference || null,
    };
  }
}
