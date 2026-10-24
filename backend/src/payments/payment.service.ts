import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Payment, PaymentStatus, PaymentType, PaymentProvider } from './entities/payment.entity';

export interface CreatePaymentDto {
  userId: string;
  invoiceId?: string | null;
  type: PaymentType;
  provider: PaymentProvider;
  reference: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
  ) {}

  /** Idempotent: returns the existing payment if the reference is already known. */
  async create(dto: CreatePaymentDto): Promise<Payment> {
    const existing = await this.repo.findOne({ where: { reference: dto.reference } });
    if (existing) return existing;
    return this.repo.save(
      this.repo.create({
        ...dto,
        status: PaymentStatus.PENDING,
        currency: (dto.currency || 'NGN').toUpperCase(),
      }),
    );
  }

  /**
   * The live (PENDING or SUCCEEDED) payment for an invoice, if any.
   *
   * Used to stop a second checkout being opened for an invoice that is already
   * being paid or has been paid: two live payments mean two captures and only one
   * settlement, leaving the buyer charged twice with no refund path.
   */
  async findLiveForInvoice(invoiceId: string): Promise<Payment | null> {
    return this.repo.findOne({
      where: {
        invoiceId,
        status: In([PaymentStatus.PENDING, PaymentStatus.SUCCEEDED]),
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * A payment by reference, scoped to its owner.
   *
   * The unscoped lookup let a caller resolve another user's payment by guessing
   * or supplying their reference. Webhooks do not have a caller identity, so they
   * keep using `findByReference`; user-facing paths must use this.
   */
  async findByReferenceForUser(
    reference: string,
    userId: string,
  ): Promise<Payment | null> {
    return this.repo.findOne({ where: { reference, userId } });
  }

  async findByReference(reference: string): Promise<Payment | null> {
    return this.repo.findOne({ where: { reference } });
  }

  async updateStatus(
    id: string,
    status: PaymentStatus,
    extra: Partial<Payment> = {},
  ): Promise<Payment> {
    const payment = await this.repo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    payment.status = status;
    Object.assign(payment, extra);
    return this.repo.save(payment);
  }

  async listByUser(userId: string): Promise<Payment[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  /** Pending payments older than the given window, oldest first (for reconciliation). */
  async findPending(olderThanMs: number, limit = 25): Promise<Payment[]> {
    const cutoff = new Date(Date.now() - olderThanMs);
    return this.repo
      .createQueryBuilder('p')
      .where('p.status = :status', { status: PaymentStatus.PENDING })
      .andWhere('p.createdAt <= :cutoff', { cutoff })
      .orderBy('p.createdAt', 'ASC')
      .take(limit)
      .getMany();
  }
}
