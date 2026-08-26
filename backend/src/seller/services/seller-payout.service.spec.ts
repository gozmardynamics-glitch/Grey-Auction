import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { SellerPayoutService } from './seller-payout.service';
import { SellerPayout, PayoutStatus } from '../entities/seller-payout.entity';
import { Seller } from '../entities/seller.entity';
import { Invoice } from '../../invoices/invoice.entity';

describe('SellerPayoutService', () => {
  let service: SellerPayoutService;
  const payoutRepo = { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn() };
  const sellerRepo = { findOne: jest.fn() };
  const invoiceRepo = { find: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerPayoutService,
        { provide: getRepositoryToken(SellerPayout), useValue: payoutRepo },
        { provide: getRepositoryToken(Seller), useValue: sellerRepo },
        { provide: getRepositoryToken(Invoice), useValue: invoiceRepo },
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

  it('rejects a payout above the real invoice-derived balance', async () => {
    (sellerRepo.findOne as jest.Mock).mockResolvedValue(seller);
    (invoiceRepo.find as jest.Mock).mockResolvedValue([
      { status: 'paid', hammer_price: '50000', commission: '5000' },
      { status: 'cancelled', hammer_price: '999999', commission: '0' }, // excluded
    ]);
    (payoutRepo.find as jest.Mock).mockResolvedValue([
      { gross_amount: '20000', status: PayoutStatus.COMPLETED },
    ]);

    // earned = 50000 (non-cancelled) - withdrawn 20000 = 30000 available
    await expect(
      service.requestPayout('s1', { amount: 40000 } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows a payout within the real available balance', async () => {
    (sellerRepo.findOne as jest.Mock).mockResolvedValue(seller);
    (invoiceRepo.find as jest.Mock).mockResolvedValue([
      { status: 'paid', hammer_price: '50000', commission: '5000' },
    ]);
    (payoutRepo.findOne as jest.Mock).mockResolvedValue(null); // no pending payout
    (payoutRepo.find as jest.Mock).mockResolvedValue([]);
    (payoutRepo.create as jest.Mock).mockReturnValue({ id: 'p1' });
    (payoutRepo.save as jest.Mock).mockResolvedValue({ id: 'p1' });

    const res = await service.requestPayout('s1', { amount: 30000 } as any);

    expect(res).toEqual({ id: 'p1' });
    // 10% commission
    expect(payoutRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        gross_amount: 30000,
        commission_amount: 3000,
        net_amount: 27000,
      }),
    );
  });
});
