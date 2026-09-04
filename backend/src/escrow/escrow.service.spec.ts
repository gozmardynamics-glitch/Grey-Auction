import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EscrowService } from './escrow.service';
import { EscrowHold, EscrowStatus } from './entities/escrow-hold.entity';
import { Invoice } from '../invoices/invoice.entity';
import { WalletService } from '../wallet/wallet.service';
import { WalletTransactionType } from '../wallet/wallet-transaction.entity';

describe('EscrowService', () => {
  let service: EscrowService;
  const holds = { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn() };
  const invoiceRepo = { findOne: jest.fn().mockResolvedValue(null) };
  // dataSource.transaction runs its callback with a manager whose getRepository
  // returns the mocked repository, so the transaction path is exercised.
  const manager = {
    getRepository: jest.fn((entity: any) => (entity === Invoice ? invoiceRepo : holds)),
  };
  const dataSource = {
    transaction: jest.fn(async (cb: any) => cb(manager)),
    getRepository: jest.fn((entity: any) => (entity === Invoice ? invoiceRepo : holds)),
  };
  const walletService = { creditInManager: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscrowService,
        { provide: getRepositoryToken(EscrowHold), useValue: holds },
        { provide: getRepositoryToken(Invoice), useValue: invoiceRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: WalletService, useValue: walletService },
      ],
    }).compile();
    service = module.get<EscrowService>(EscrowService);
    // Default: hold()'s invoice precheck sees a payable, buyer-owned invoice.
    (invoiceRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'inv-1',
      buyer_id: 'b1',
      seller_id: 's1',
      total: '2500000',
      status: 'issued',
      escrow_window_hours: null,
      paid_at: null,
    });
  });

  const input = { invoiceId: 'inv-1', amount: 2500000, buyerId: 'b1', sellerId: 's1' };

  it('places a hold', async () => {
    (holds.findOne as jest.Mock).mockResolvedValue(null);
    (holds.create as jest.Mock).mockImplementation((x) => x);
    (holds.save as jest.Mock).mockImplementation(async (x) => ({ id: 'h1', ...x }));

    const res = await service.hold(input);
    expect(res.status).toBe(EscrowStatus.HELD);
    expect(res.amount).toBe(2500000);
  });

  it('rejects a zero/negative amount', async () => {
    await expect(service.hold({ ...input, amount: 0 })).rejects.toThrow(BadRequestException);
  });

  it('rejects a second hold while funds are already in escrow', async () => {
    (holds.findOne as jest.Mock).mockResolvedValue({ id: 'h1', status: EscrowStatus.HELD });
    await expect(service.hold(input)).rejects.toThrow(ConflictException);
  });

  it('releases funds once and credits the seller wallet atomically', async () => {
    (holds.findOne as jest.Mock).mockResolvedValue({ id: 'h1', status: EscrowStatus.HELD, buyerId: 'b1', sellerId: 's1', invoiceId: 'inv-1', amount: 2500000 });
    (holds.save as jest.Mock).mockImplementation(async (x) => x);

    const res = await service.release('h1', 'admin1');
    expect(res.status).toBe(EscrowStatus.RELEASED);
    expect(res.releasedAt).toBeInstanceOf(Date);
    expect(walletService.creditInManager).toHaveBeenCalledWith(
      expect.anything(),
      's1',
      expect.objectContaining({ amount: 2500000, type: WalletTransactionType.ESCROW_RELEASE, reference: 'escrow_release:h1' }),
    );
  });

  it('refunds with a mandatory reason and credits the buyer wallet', async () => {
    await expect(service.refund('h1', 'admin1', '  ')).rejects.toThrow(BadRequestException);

    (holds.findOne as jest.Mock).mockResolvedValue({ id: 'h1', status: EscrowStatus.DISPUTED, buyerId: 'b1', sellerId: 's1', invoiceId: 'inv-1', amount: 2500000 });
    (holds.save as jest.Mock).mockImplementation(async (x) => x);
    const res = await service.refund('h1', 'admin1', 'Item not as described');
    expect(res.status).toBe(EscrowStatus.REFUNDED);
    expect(res.refundReason).toBe('Item not as described');
    expect(walletService.creditInManager).toHaveBeenCalledWith(
      expect.anything(),
      'b1',
      expect.objectContaining({ amount: 2500000, type: WalletTransactionType.ESCROW_REFUND, reference: 'escrow_refund:h1' }),
    );
  });

  it('moves a held amount to disputed only for a party', async () => {
    (holds.findOne as jest.Mock).mockResolvedValue({ id: 'h1', status: EscrowStatus.HELD, buyerId: 'b1', sellerId: 's1' });
    await expect(service.markDisputed('h1', 'stranger')).rejects.toThrow(NotFoundException);

    (holds.save as jest.Mock).mockImplementation(async (x) => x);
    const res = await service.markDisputed('h1', 'b1');
    expect(res.status).toBe(EscrowStatus.DISPUTED);
  });

  it('refuses to settle an already-settled hold', async () => {
    (holds.findOne as jest.Mock).mockResolvedValue({ id: 'h1', status: EscrowStatus.RELEASED });
    await expect(service.release('h1', 'admin1')).rejects.toThrow(BadRequestException);
    await expect(service.refund('h1', 'admin1', 'reason')).rejects.toThrow(BadRequestException);
  });

  it('filters holds by the viewer', async () => {
    (holds.find as jest.Mock).mockResolvedValue([
      { id: 'h1', buyerId: 'b1', sellerId: 's1' },
      { id: 'h2', buyerId: 'x', sellerId: 'y' },
    ]);
    const rows = await service.getForInvoice('inv-1', 'b1');
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('h1');
  });

  describe('escrow auto-release window (U5 #4)', () => {
    it('computeReleaseAt anchors on paid time and honours the hours window', () => {
      const paid = new Date('2026-09-02T10:00:00Z');
      expect(service.computeReleaseAt(24, paid).toISOString()).toBe('2026-09-03T10:00:00.000Z');
      // 0 = immediate release at payment time
      expect(service.computeReleaseAt(0, paid).toISOString()).toBe(paid.toISOString());
      // null window = manual release only
      expect(service.computeReleaseAt(null, paid)).toBeNull();
      // negative windows are treated as no auto-release
      expect(service.computeReleaseAt(-1, paid)).toBeNull();
    });

    it('hold() copies the invoice window onto the hold row', async () => {
      (holds.findOne as jest.Mock).mockResolvedValue(null);
      (holds.create as jest.Mock).mockImplementation((x) => x);
      (holds.save as jest.Mock).mockImplementation(async (x) => ({ id: 'h2', ...x }));
      (invoiceRepo.findOne as jest.Mock).mockResolvedValue({
        id: 'inv-1',
        buyer_id: 'b1',
        seller_id: 's1',
        total: '2500000',
        status: 'issued',
        escrow_window_hours: 48,
        paid_at: new Date('2026-09-02T10:00:00Z'),
      });

      const res = await service.hold(input);
      expect(res.autoReleaseAt).toBeInstanceOf(Date);
      expect(res.autoReleaseAt.toISOString()).toBe('2026-09-04T10:00:00.000Z');
    });

    it('autoReleaseDue releases only HELD holds past their timestamp and credits the seller', async () => {
      const due = [{ id: 'h1', status: EscrowStatus.HELD, autoReleaseAt: new Date(Date.now() - 1000), amount: 5000, sellerId: 's1', invoiceId: 'inv-1' }];
      (holds.find as jest.Mock).mockResolvedValue(due);
      // inside the sweep transaction the locked row is still HELD and due
      (holds.findOne as jest.Mock).mockResolvedValue(due[0]);
      (holds.save as jest.Mock).mockImplementation(async (x) => x);

      const released = await service.autoReleaseDue();

      expect(released).toBe(1);
      expect(walletService.creditInManager).toHaveBeenCalledWith(
        expect.anything(),
        's1',
        expect.objectContaining({
          amount: 5000,
          type: WalletTransactionType.ESCROW_RELEASE,
          reference: 'escrow_auto_release:h1',
        }),
      );
    });

    it('autoReleaseDue skips a hold that was settled by a concurrent run', async () => {
      (holds.find as jest.Mock).mockResolvedValue([
        { id: 'h2', status: EscrowStatus.HELD, autoReleaseAt: new Date(Date.now() - 1000) },
      ]);
      (holds.findOne as jest.Mock).mockResolvedValue({
        id: 'h2',
        status: EscrowStatus.RELEASED,
        autoReleaseAt: new Date(Date.now() - 1000),
      });

      const released = await service.autoReleaseDue();
      expect(released).toBe(0);
      expect(walletService.creditInManager).not.toHaveBeenCalled();
    });
  });
});
