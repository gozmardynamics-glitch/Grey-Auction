import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Wallet } from './wallet.entity';
import {
  WalletTransaction,
  WalletTransactionType,
  WalletTransactionStatus,
} from './wallet-transaction.entity';

export interface DepositDto {
  amount: number;
  reference?: string;
}

export interface WithdrawDto {
  amount: number;
  pin?: string;
}

/**
 * Digital wallet backed by the database. Deposits/withdrawals in the current
 * dev mode are settled immediately (the payment gateway runs in mock mode);
 * when gateway keys are configured, deposits can be linked to a payment
 * reference for reconciliation.
 */
@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly txRepo: Repository<WalletTransaction>,
  ) {}

  private async getOrCreate(userId: string): Promise<Wallet> {
    const existing = await this.walletRepo.findOne({ where: { userId } });
    if (existing) return existing;
    const wallet = this.walletRepo.create({ userId, balance: 0, currency: 'NGN' });
    return this.walletRepo.save(wallet);
  }

  async getWallet(userId: string) {
    const wallet = await this.getOrCreate(userId);
    return {
      id: wallet.id,
      balance: Number(wallet.balance),
      currency: wallet.currency,
      hasPin: wallet.hasPin,
    };
  }

  async getTransactions(userId: string) {
    const wallet = await this.getOrCreate(userId);
    return this.txRepo.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async deposit(userId: string, dto: DepositDto) {
    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }
    const wallet = await this.getOrCreate(userId);

    // Idempotency guard: a deposit reference must never be credited twice.
    // If a completed deposit with this reference already exists, return it
    // without touching the balance (prevents webhook/deposit replays).
    if (dto.reference) {
      const existing = await this.txRepo.findOne({
        where: { reference: dto.reference, type: WalletTransactionType.DEPOSIT },
      });
      if (existing) {
        return {
          balance: Number(wallet.balance),
          transaction: existing,
          idempotent: true,
        };
      }
    }

    const newBalance = Number(wallet.balance) + dto.amount;
    await this.walletRepo.update(wallet.id, { balance: newBalance });

    let tx: WalletTransaction;
    try {
      tx = await this.txRepo.save(
        this.txRepo.create({
          walletId: wallet.id,
          type: WalletTransactionType.DEPOSIT,
          amount: dto.amount,
          reference: dto.reference || null,
          description: dto.reference ? 'Wallet deposit' : 'Wallet deposit (mock)',
          status: WalletTransactionStatus.COMPLETED,
        }),
      );
    } catch (err: any) {
      // DB unique constraint on reference won any race: return the existing deposit.
      const raced = await this.txRepo.findOne({
        where: { reference: dto.reference || undefined, type: WalletTransactionType.DEPOSIT },
      });
      if (raced) {
        return {
          balance: Number(wallet.balance),
          transaction: raced,
          idempotent: true,
        };
      }
      throw err;
    }

    return { balance: newBalance, transaction: tx, idempotent: false };
  }

  async withdraw(userId: string, dto: WithdrawDto) {
    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }
    const wallet = await this.getOrCreate(userId);

    if (wallet.hasPin && wallet.pinHash) {
      if (!dto.pin || !(await bcrypt.compare(dto.pin, wallet.pinHash))) {
        throw new BadRequestException('Invalid PIN');
      }
    }

    const balance = Number(wallet.balance);
    if (dto.amount > balance) {
      throw new BadRequestException('Insufficient balance');
    }

    const newBalance = balance - dto.amount;
    await this.walletRepo.update(wallet.id, { balance: newBalance });

    const tx = await this.txRepo.save(
      this.txRepo.create({
        walletId: wallet.id,
        type: WalletTransactionType.WITHDRAW,
        amount: dto.amount,
        status: WalletTransactionStatus.COMPLETED,
      }),
    );

    return { balance: newBalance, transaction: tx };
  }

  async setPin(userId: string, pin: string) {
    if (!pin || !/^\d{4,6}$/.test(pin)) {
      throw new BadRequestException('PIN must be 4-6 digits');
    }
    const wallet = await this.getOrCreate(userId);
    const pinHash = await bcrypt.hash(pin, 10);
    await this.walletRepo.update(wallet.id, { pinHash, hasPin: true });
    const updated = await this.walletRepo.findOne({ where: { id: wallet.id } });
    return { hasPin: updated?.hasPin ?? true };
  }

  async verifyPin(userId: string, pin: string): Promise<boolean> {
    const wallet = await this.getOrCreate(userId);
    if (!wallet.hasPin || !wallet.pinHash) return true; // no PIN set -> allow
    return bcrypt.compare(pin, wallet.pinHash);
  }
}
