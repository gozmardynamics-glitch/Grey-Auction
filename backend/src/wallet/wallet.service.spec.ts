import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WalletService } from './wallet.service';
import { Wallet } from './wallet.entity';
import { WalletTransaction, WalletTransactionType } from './wallet-transaction.entity';

describe('WalletService', () => {
  let service: WalletService;
  const walletRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), update: jest.fn() };
  const txRepo = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const manager = {
    getRepository: jest.fn((entity) => (entity === Wallet ? walletRepo : txRepo)),
  };
  const dataSource = { transaction: jest.fn(async (cb: any) => cb(manager)) };

  beforeEach(async () => {
    jest.clearAllMocks();
    (dataSource.transaction as jest.Mock).mockImplementation(async (cb: any) => cb(manager));
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: getRepositoryToken(Wallet), useValue: walletRepo },
        { provide: getRepositoryToken(WalletTransaction), useValue: txRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get<WalletService>(WalletService);
  });

  it('deposit credits the balance and records a ledger row under a pessimistic lock', async () => {
    const wallet = { id: 'w1', userId: 'u1', balance: 0, hasPin: false, pinHash: null };
    (walletRepo.findOne as jest.Mock).mockResolvedValue(wallet);
    (walletRepo.update as jest.Mock).mockResolvedValue({});
    (txRepo.create as jest.Mock).mockReturnValue({ id: 't1' });
    (txRepo.save as jest.Mock).mockResolvedValue({ id: 't1' });

    const res = await service.deposit('u1', { amount: 5000 });

    expect(res.balance).toBe(5000);
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(walletRepo.findOne).toHaveBeenCalledWith({ where: { userId: 'u1' }, lock: { mode: 'pessimistic_write' } });
    expect(walletRepo.update).toHaveBeenCalledWith('w1', { balance: 5000 });
    expect(txRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: WalletTransactionType.DEPOSIT, amount: 5000, balanceAfter: 5000 }),
    );
  });

  it('withdraw debits atomically under a pessimistic lock', async () => {
    const wallet = { id: 'w1', userId: 'u1', balance: 1000, hasPin: false, pinHash: null };
    (walletRepo.findOne as jest.Mock).mockResolvedValue(wallet);
    (walletRepo.update as jest.Mock).mockResolvedValue({});
    (txRepo.create as jest.Mock).mockReturnValue({ id: 't1' });
    (txRepo.save as jest.Mock).mockResolvedValue({ id: 't1' });

    const res = await service.withdraw('u1', { amount: 400 });

    expect(res.balance).toBe(600);
    expect(walletRepo.findOne).toHaveBeenCalledWith({ where: { userId: 'u1' }, lock: { mode: 'pessimistic_write' } });
    expect(txRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: WalletTransactionType.WITHDRAW, amount: 400, balanceAfter: 600 }),
    );
  });

  it('withdraw rejects amounts above the balance', async () => {
    (walletRepo.findOne as jest.Mock).mockResolvedValue({ id: 'w1', userId: 'u1', balance: 100, hasPin: false, pinHash: null });
    await expect(service.withdraw('u1', { amount: 500 })).rejects.toThrow(BadRequestException);
  });

  it('withdraw requires a matching PIN when one is set', async () => {
    (walletRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'w1', userId: 'u1', balance: 1000, hasPin: true,
      pinHash: '$2b$10$CwTycUXWue0Thq9StjUM0uJ8l9xQ2f0XgL8jNQ0Q0Q0Q0Q0Q0Q',
    });
    await expect(service.withdraw('u1', { amount: 100, pin: '0000' })).rejects.toThrow(BadRequestException);
  });

  it('rejects non-numeric PINs', async () => {
    (walletRepo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.setPin('u1', 'abcd')).rejects.toThrow(BadRequestException);
  });

  it('getWallet returns a default zero-balance wallet', async () => {
    (walletRepo.findOne as jest.Mock).mockResolvedValue(null);
    const created = { id: 'w1', userId: 'u1', balance: 0, currency: 'NGN', hasPin: false };
    (walletRepo.create as jest.Mock).mockReturnValue(created);
    (walletRepo.save as jest.Mock).mockResolvedValue(created);

    const res = await service.getWallet('u1');
    expect(res.balance).toBe(0);
    expect(res.currency).toBe('NGN');
  });

  it('returns transactions newest-first', async () => {
    (walletRepo.findOne as jest.Mock).mockResolvedValue({ id: 'w1', userId: 'u1', balance: 0, hasPin: false, pinHash: null });
    (txRepo.find as jest.Mock).mockResolvedValue([{ id: 't2' }, { id: 't1' }]);

    const res = await service.getTransactions('u1');
    expect(res).toHaveLength(2);
    expect(txRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { walletId: 'w1' }, order: { createdAt: 'DESC' } }),
    );
  });

  it('deposit is idempotent when a reference already exists (no double credit)', async () => {
    const wallet = { id: 'w1', userId: 'u1', balance: 5000, hasPin: false, pinHash: null };
    const existingTx = { id: 't-old', walletId: 'w1', type: WalletTransactionType.DEPOSIT, reference: 'REF-1', amount: 5000 };
    (walletRepo.findOne as jest.Mock).mockResolvedValue(wallet);
    (txRepo.findOne as jest.Mock).mockResolvedValue(existingTx);

    const res = await service.deposit('u1', { amount: 5000, reference: 'REF-1' });

    expect(res.idempotent).toBe(true);
    expect(res.transaction).toBe(existingTx);
    expect(res.balance).toBe(5000);
    expect(walletRepo.update).not.toHaveBeenCalled();
    expect(txRepo.save).not.toHaveBeenCalled();
  });

  it('deposit credits a brand-new reference once', async () => {
    const wallet = { id: 'w1', userId: 'u1', balance: 1000, hasPin: false, pinHash: null };
    const newTx = { id: 't-new', walletId: 'w1', type: WalletTransactionType.DEPOSIT, reference: 'REF-2', amount: 500 };
    (walletRepo.findOne as jest.Mock).mockResolvedValue(wallet);
    (txRepo.findOne as jest.Mock).mockResolvedValue(null);
    (walletRepo.update as jest.Mock).mockResolvedValue({});
    (txRepo.create as jest.Mock).mockReturnValue(newTx);
    (txRepo.save as jest.Mock).mockResolvedValue(newTx);

    const res = await service.deposit('u1', { amount: 500, reference: 'REF-2' });

    expect(res.idempotent).toBe(false);
    expect(res.balance).toBe(1500);
    expect(walletRepo.update).toHaveBeenCalledWith('w1', { balance: 1500 });
  });

  it('deposit rolls back the balance when a concurrent deposit wins the reference race', async () => {
    const wallet = { id: 'w1', userId: 'u1', balance: 5000, hasPin: false, pinHash: null };
    const racedTx = { id: 't-race', walletId: 'w1', type: WalletTransactionType.DEPOSIT, reference: 'REF-3', amount: 5000 };
    (walletRepo.findOne as jest.Mock).mockResolvedValue(wallet);
    const err = Object.assign(new Error('duplicate key value violates unique constraint'), { code: '23505' });
    (dataSource.transaction as jest.Mock).mockRejectedValueOnce(err);
    (txRepo.findOne as jest.Mock).mockResolvedValue(racedTx);

    const res = await service.deposit('u1', { amount: 5000, reference: 'REF-3' });

    expect(res.idempotent).toBe(true);
    expect(res.transaction).toBe(racedTx);
    expect(res.balance).toBe(5000);
    expect(walletRepo.update).not.toHaveBeenCalled();
  });

  it('creditInManager writes a running-balance ledger row within the caller transaction', async () => {
    const wallet = { id: 'w1', userId: 's1', balance: 0, hasPin: false, pinHash: null };
    (walletRepo.findOne as jest.Mock).mockResolvedValue(wallet);
    (walletRepo.update as jest.Mock).mockResolvedValue({});
    (txRepo.findOne as jest.Mock).mockResolvedValue(null);
    (txRepo.create as jest.Mock).mockReturnValue({ id: 't-escrow' });
    (txRepo.save as jest.Mock).mockResolvedValue({ id: 't-escrow' });

    const res = await service.creditInManager(manager as any, 's1', {
      amount: 2500000, reference: 'escrow_release:h1', description: 'Escrow release', type: WalletTransactionType.ESCROW_RELEASE,
    });

    expect(res.balance).toBe(2500000);
    expect(txRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: WalletTransactionType.ESCROW_RELEASE, reference: 'escrow_release:h1', balanceAfter: 2500000 }),
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
