import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { EscrowHold, EscrowStatus } from './entities/escrow-hold.entity';

describe('EscrowService', () => {
  let service: EscrowService;
  const holds = { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscrowService,
        { provide: getRepositoryToken(EscrowHold), useValue: holds },
      ],
    }).compile();
    service = module.get<EscrowService>(EscrowService);
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

  it('releases funds once', async () => {
    (holds.findOne as jest.Mock).mockResolvedValue({ id: 'h1', status: EscrowStatus.HELD, buyerId: 'b1', sellerId: 's1' });
    (holds.save as jest.Mock).mockImplementation(async (x) => x);

    const res = await service.release('h1', 'admin1');
    expect(res.status).toBe(EscrowStatus.RELEASED);
    expect(res.releasedAt).toBeInstanceOf(Date);
  });

  it('refunds with a mandatory reason', async () => {
    await expect(service.refund('h1', 'admin1', '  ')).rejects.toThrow(BadRequestException);

    (holds.findOne as jest.Mock).mockResolvedValue({ id: 'h1', status: EscrowStatus.DISPUTED });
    (holds.save as jest.Mock).mockImplementation(async (x) => x);
    const res = await service.refund('h1', 'admin1', 'Item not as described');
    expect(res.status).toBe(EscrowStatus.REFUNDED);
    expect(res.refundReason).toBe('Item not as described');
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
});
