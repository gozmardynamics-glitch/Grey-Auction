import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
        currency: dto.currency || 'NGN',
      }),
    );
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
}
