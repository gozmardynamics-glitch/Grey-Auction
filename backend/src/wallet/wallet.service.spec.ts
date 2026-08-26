import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { Wallet } from './wallet.entity';
import { WalletTransaction, WalletTransactionType } from './wallet-transaction.entity';

describe('WalletService', () => {
  let service: WalletService;
  const walletRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const txRepo = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: getRepositoryToken(Wallet), useValue: walletRepo },
        { provide: getRepositoryToken(WalletTransaction), useValue: txRepo },
      ],
    }).compile();
    service = module.get<WalletService>(WalletService);
  });

  it('deposit credits the balance and records a transaction', async () => {
    const wallet = { id: 'w1', userId: 'u1', balance: 0, hasPin: false, pinHash: null };
    (walletRepo.findOne as jest.Mock).mockResolvedValue(wallet);
    (walletRepo.update as jest.Mock).mockResolvedValue({});
    (txRepo.create as jest.Mock).mockReturnValue({ id: 't1' });
    (txRepo.save as jest.Mock).mockResolvedValue({ id: 't1' });

    const res = await service.deposit('u1', { amount: 5000 });

    expect(res.balance).toBe(5000);
    expect(walletRepo.update).toHaveBeenCalledWith('w1', { balance: 5000 });
    expect(txRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: WalletTransactionType.DEPOSIT, amount: 5000 }),
    );
  });

  it('withdraw debits only when balance is sufficient', async () => {
    const wallet = { id: 'w1', userId: 'u1', balance: 1000, hasPin: false, pinHash: null };
    (walletRepo.findOne as jest.Mock).mockResolvedValue(wallet);
    (walletRepo.update as jest.Mock).mockResolvedValue({});
    (txRepo.create as jest.Mock).mockReturnValue({ id: 't1' });
    (txRepo.save as jest.Mock).mockResolvedValue({ id: 't1' });

    const res = await service.withdraw('u1', { amount: 400 });
    expect(res.balance).toBe(600);
  });

  it('withdraw rejects amounts above the balance', async () => {
    const wallet = { id: 'w1', userId: 'u1', balance: 100, hasPin: false, pinHash: null };
    (walletRepo.findOne as jest.Mock).mockResolvedValue(wallet);

    await expect(service.withdraw('u1', { amount: 500 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('withdraw requires a matching PIN when one is set', async () => {
    const wallet = {
      id: 'w1',
      userId: 'u1',
      balance: 1000,
      hasPin: true,
      pinHash: '$2b$10$CwTycUXWue0Thq9StjUM0uJ8l9xQ2f0XgL8jNQ0Q0Q0Q0Q0Q0Q', // dummy
    };
    (walletRepo.findOne as jest.Mock).mockResolvedValue(wallet);

    await expect(service.withdraw('u1', { amount: 100, pin: '0000' })).rejects.toThrow(
      BadRequestException,
    );
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
    const wallet = { id: 'w1', userId: 'u1', balance: 0, hasPin: false, pinHash: null };
    (walletRepo.findOne as jest.Mock).mockResolvedValue(wallet);
    (txRepo.find as jest.Mock).mockResolvedValue([{ id: 't2' }, { id: 't1' }]);

    const res = await service.getTransactions('u1');
    expect(res).toHaveLength(2);
    expect(txRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { walletId: 'w1' }, order: { createdAt: 'DESC' } }),
    );
  });
});
