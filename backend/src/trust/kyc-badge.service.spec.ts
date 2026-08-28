import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { KycBadgeService } from './kyc-badge.service';
import { Seller, SellerVerificationStatus, SellerStatus } from '../seller/entities/seller.entity';
import { SellerDocument } from '../seller/entities/seller-document.entity';

describe('KycBadgeService', () => {
  let service: KycBadgeService;
  const sellers = { findOne: jest.fn() };
  const docs = { count: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycBadgeService,
        { provide: getRepositoryToken(Seller), useValue: sellers },
        { provide: getRepositoryToken(SellerDocument), useValue: docs },
      ],
    }).compile();
    service = module.get<KycBadgeService>(KycBadgeService);
  });

  const seller = (over: Partial<Seller> = {}) =>
    ({
      id: 's1',
      business_name: 'Acme Heavy Equipment',
      verification_status: SellerVerificationStatus.APPROVED,
      status: SellerStatus.ACTIVE,
      rating: 4.5,
      total_sales: 12,
      created_at: new Date('2025-01-02'),
      ...over,
    }) as Seller;

  it('throws for unknown sellers', async () => {
    (sellers.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.badgeForSeller('nope')).rejects.toThrow(NotFoundException);
  });

  it('issues "trusted" for approved sellers with >= 2 approved documents', async () => {
    (sellers.findOne as jest.Mock).mockResolvedValue(seller());
    (docs.count as jest.Mock).mockResolvedValue(3);
    const view = await service.badgeForSeller('s1');
    expect(view.badge).toBe('trusted');
    expect(view.approvedDocuments).toBe(3);
  });

  it('issues "verified" for approved sellers with fewer documents', async () => {
    (sellers.findOne as jest.Mock).mockResolvedValue(seller());
    (docs.count as jest.Mock).mockResolvedValue(1);
    expect((await service.badgeForSeller('s1')).badge).toBe('verified');
  });

  it('shows "pending" while under review', async () => {
    (sellers.findOne as jest.Mock).mockResolvedValue(seller({ verification_status: SellerVerificationStatus.UNDER_REVIEW }));
    (docs.count as jest.Mock).mockResolvedValue(0);
    expect((await service.badgeForSeller('s1')).badge).toBe('pending');
  });

  it('shows no badge for rejected or suspended sellers', async () => {
    (sellers.findOne as jest.Mock).mockResolvedValue(seller({ verification_status: SellerVerificationStatus.REJECTED }));
    (docs.count as jest.Mock).mockResolvedValue(0);
    expect((await service.badgeForSeller('s1')).badge).toBe('unverified');

    (sellers.findOne as jest.Mock).mockResolvedValue(seller({ status: SellerStatus.SUSPENDED }));
    expect((await service.badgeForSeller('s1')).badge).toBe('unverified');
  });

  it('never leaks document details — only counts + coarse status', async () => {
    (sellers.findOne as jest.Mock).mockResolvedValue(seller());
    (docs.count as jest.Mock).mockResolvedValue(2);
    const view = await service.badgeForSeller('s1');
    expect(Object.keys(view).sort()).toEqual(
      ['approvedDocuments', 'badge', 'businessName', 'memberSince', 'rating', 'sellerId', 'totalSales', 'verificationStatus'].sort(),
    );
  });
});
