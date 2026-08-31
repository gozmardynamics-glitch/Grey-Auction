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

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

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
