import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
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

/** Input for a wallet credit performed within an existing transaction. */
export interface WalletCreditInput {
  amount: number;
  reference?: string;
  description?: string;
  type: WalletTransactionType;
}

/** True when the error is a Postgres unique-constraint violation (code 23505). */
function isUniqueViolation(err: any): boolean {
  return (
    err?.code === '23505' ||
    err?.driverError?.code === '23505' ||
    (typeof err?.message === 'string' && err.message.includes('duplicate key value'))
  );
}

/**
 * Digital wallet backed by the database. Every balance mutation runs inside a
 * DB transaction and appends an immutable ledger row, so the wallet can never
 * overdraw or double-credit under concurrency. Deposits/withdrawals in the
 * current dev mode settle immediately (the payment gateway runs in mock mode);
 * when gateway keys are configured, deposits link to a payment reference.
 */
@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly txRepo: Repository<WalletTransaction>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /** Read-path wallet access: create the row if missing (race-safe). */
  private async getOrCreate(userId: string): Promise<Wallet> {
    const existing = await this.walletRepo.findOne({ where: { userId } });
    if (existing) return existing;
    const wallet = this.walletRepo.create({ userId, balance: 0, currency: 'NGN' });
    try {
      return await this.walletRepo.save(wallet);
    } catch (err: any) {
      // Lost the unique(userId) race: the other insert won — read it back.
      if (isUniqueViolation(err)) {
        const raced = await this.walletRepo.findOne({ where: { userId } });
        if (raced) return raced;
      }
      throw err;
    }
  }

  /**
   * Fetch (or create) the wallet inside a transaction and take a pessimistic
   * write lock so concurrent debits/credits for the same user serialize and can
   * never overdraw or double-spend.
   */
  private async getOrCreateLocked(manager: EntityManager, userId: string): Promise<Wallet> {
    const repo = manager.getRepository(Wallet);
    let wallet = await repo.findOne({
      where: { userId },
      lock: { mode: 'pessimistic_write' },
    });
    if (wallet) return wallet;

    const created = repo.create({ userId, balance: 0, currency: 'NGN' });
    try {
      return await repo.save(created);
    } catch (err: any) {
      if (isUniqueViolation(err)) {
        wallet = await repo.findOne({
          where: { userId },
          lock: { mode: 'pessimistic_write' },
        });
        if (wallet) return wallet;
      }
      throw err;
    }
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
    // Production fail-closed: real wallet credits may ONLY originate from the
    // signature-verified payment webhook (payments/init type=deposit ->
    // provider -> webhook -> orchestration). This endpoint is a local/dev
    // convenience and previously minted arbitrary balance from any request.
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Direct wallet deposits are disabled — fund your wallet through checkout',
      );
    }
    try {
      return await this.dataSource.transaction((manager) =>
        this.credit(manager, userId, {
          amount: dto.amount,
          reference: dto.reference,
          description: dto.reference ? 'Wallet deposit' : 'Wallet deposit (mock)',
          type: WalletTransactionType.DEPOSIT,
        }),
      );
    } catch (err: any) {
      // A concurrent deposit with the same reference inserted first. The whole
      // transaction rolled back, so no balance change leaked; return the winner.
      if (dto.reference && isUniqueViolation(err)) {
        const raced = await this.txRepo.findOne({
          where: { reference: dto.reference, type: WalletTransactionType.DEPOSIT },
        });
        if (raced) {
          const wallet = await this.getOrCreate(userId);
          return { balance: Number(wallet.balance), transaction: raced, idempotent: true };
        }
      }
      throw err;
    }
  }

  async withdraw(userId: string, dto: WithdrawDto) {
    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }
    return this.dataSource.transaction(async (manager) => {
      const wallet = await this.getOrCreateLocked(manager, userId);

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
      const txRepo = manager.getRepository(WalletTransaction);
      await manager.getRepository(Wallet).update(wallet.id, { balance: newBalance });

      const tx = await txRepo.save(
        txRepo.create({
          walletId: wallet.id,
          type: WalletTransactionType.WITHDRAW,
          amount: dto.amount,
          status: WalletTransactionStatus.COMPLETED,
          balanceAfter: newBalance,
        }),
      );

      return { balance: newBalance, transaction: tx };
    });
  }

  /**
   * Credit a wallet within a caller-supplied transaction (escrow payout, payment
   * capture). The ledger row commits or rolls back with the caller's transaction.
   */
  async creditInManager(
    manager: EntityManager,
    userId: string,
    input: WalletCreditInput,
  ) {
    return this.credit(manager, userId, input);
  }

  /** Core credit: lock wallet, re-check idempotency, update balance, write ledger. */
  private async credit(
    manager: EntityManager,
    userId: string,
    input: WalletCreditInput,
  ) {
    if (!input.amount || input.amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }
    const wallet = await this.getOrCreateLocked(manager, userId);
    const txRepo = manager.getRepository(WalletTransaction);

    if (input.reference) {
      const existing = await txRepo.findOne({
        where: { reference: input.reference, type: input.type },
      });
      if (existing) {
        return { balance: Number(wallet.balance), transaction: existing, idempotent: true };
      }
    }

    const newBalance = Number(wallet.balance) + input.amount;
    await manager.getRepository(Wallet).update(wallet.id, { balance: newBalance });

    const tx = await txRepo.save(
      txRepo.create({
        walletId: wallet.id,
        type: input.type,
        amount: input.amount,
        reference: input.reference || null,
        description: input.description || null,
        status: WalletTransactionStatus.COMPLETED,
        balanceAfter: newBalance,
      }),
    );

    return { balance: newBalance, transaction: tx, idempotent: false };
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
    if (!wallet.hasPin || !wallet.pinHash) return true;
    return bcrypt.compare(pin, wallet.pinHash);
  }
}
