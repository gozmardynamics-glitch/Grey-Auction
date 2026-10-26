import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { SellerPayoutService } from './seller-payout.service';
import { SellerPayout, PayoutStatus } from '../entities/seller-payout.entity';
import { Seller } from '../entities/seller.entity';
import { Invoice } from '../../invoices/invoice.entity';
import { DataSource } from 'typeorm';
import { WalletService } from '../../wallet/wallet.service';

describe('SellerPayoutService', () => {
  let service: SellerPayoutService;
  const payoutRepo = { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn() };
  const sellerRepo = { findOne: jest.fn() };
  const invoiceRepo = { find: jest.fn() };

  const walletService = {
    verifyPin: jest.fn().mockResolvedValue(true),
    getWallet: jest.fn().mockResolvedValue({ balance: 1_000_000 }),
    debitInManager: jest.fn().mockResolvedValue({ balance: 950_000 }),
    creditInManager: jest.fn().mockResolvedValue({ balance: 1_000_000 }),
  };

  const manager = {
    getRepository: jest.fn((entity: any) =>
      entity === SellerPayout ? payoutRepo :
      entity === Seller ? sellerRepo :
      invoiceRepo,
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerPayoutService,
        { provide: getRepositoryToken(SellerPayout), useValue: payoutRepo },
        { provide: getRepositoryToken(Seller), useValue: sellerRepo },
        { provide: getRepositoryToken(Invoice), useValue: invoiceRepo },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(async (cb: any) => cb(manager)),
          },
        },
        { provide: WalletService, useValue: walletService },
      ],
    }).compile();
    service = module.get<SellerPayoutService>(SellerPayoutService);
  });

  const seller: any = {
    id: 's1',
    is_active: true,
    commission_rate: 10,
    currency: 'NGN',
    payout_method: 'BANK_TRANSFER',
    bank_account_details: { bank_name: 'GTC', account_number: '0012345678', account_name: 'Bidder' },
    canReceivePayouts: () => true,
  };

  it('rejects a payout above the cleared wallet balance', async () => {
    (sellerRepo.findOne as jest.Mock).mockResolvedValue(seller);
    (payoutRepo.findOne as jest.Mock).mockResolvedValue(null);
    // The ledger is the authority: 10,000 cleared, so 40,000 is refused.
    walletService.getWallet.mockResolvedValue({ balance: 10000 });

    await expect(
      service.requestPayout('s1', { amount: 40000, pin: '1234' } as any),
    ).rejects.toThrow(BadRequestException);
    expect(walletService.debitInManager).not.toHaveBeenCalled();
  });

  it('pays out the cleared balance without charging commission twice', async () => {
    (sellerRepo.findOne as jest.Mock).mockResolvedValue(seller);
    (payoutRepo.findOne as jest.Mock).mockResolvedValue(null); // no payout in flight
    (payoutRepo.create as jest.Mock).mockImplementation((x) => x);
    (payoutRepo.save as jest.Mock).mockResolvedValue({ id: 'p1' });
    walletService.getWallet.mockResolvedValue({ balance: 50000 });

    const res = await service.requestPayout('s1', { amount: 30000, pin: '1234' } as any);

    expect(res).toEqual({ id: 'p1' });
    // The invoice already netted the commission off the seller's proceeds, so a
    // payout of 30,000 must not dock it again (it used to pay 27,000).
    expect(payoutRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        gross_amount: 30000,
        commission_amount: 0,
        net_amount: 30000,
      }),
    );
    // ...and the hold is what prevents a second request overspending it.
    expect(walletService.debitInManager).toHaveBeenCalledWith(
      expect.anything(),
      seller.user_id,
      expect.objectContaining({ amount: 30000 }),
    );
  });

  it('requires the wallet PIN before money can leave', async () => {
    (sellerRepo.findOne as jest.Mock).mockResolvedValue(seller);
    walletService.verifyPin.mockResolvedValue(false);

    await expect(
      service.requestPayout('s1', { amount: 30000, pin: '0000' } as any),
    ).rejects.toThrow('Invalid wallet PIN');
    expect(walletService.debitInManager).not.toHaveBeenCalled();
  });
});
