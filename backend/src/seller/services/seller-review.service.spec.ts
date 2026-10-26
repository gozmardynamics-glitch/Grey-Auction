import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { SellerReviewService } from './seller-review.service';
import { SellerReview } from '../entities/seller-review.entity';
import { Seller } from '../entities/seller.entity';
import { Invoice } from '../../invoices/invoice.entity';

describe('SellerReviewService', () => {
  let service: SellerReviewService;
  const reviewRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), count: jest.fn() };
  const sellerRepo = { findOne: jest.fn(), save: jest.fn() };
  const invoiceRepo = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerReviewService,
        { provide: getRepositoryToken(SellerReview), useValue: reviewRepo },
        { provide: getRepositoryToken(Seller), useValue: sellerRepo },
        { provide: getRepositoryToken(Invoice), useValue: invoiceRepo },
      ],
    }).compile();
    service = module.get<SellerReviewService>(SellerReviewService);
    jest.spyOn(service as any, 'calculateAverageRating').mockResolvedValue(4.5);
  });

  const baseMocks = () => {
    (sellerRepo.findOne as jest.Mock).mockResolvedValue({ id: 's1' });
    (reviewRepo.findOne as jest.Mock).mockResolvedValue(null);
    (reviewRepo.create as jest.Mock).mockImplementation((r: any) => r);
    (reviewRepo.save as jest.Mock).mockImplementation(async (r: any) => ({ ...r, id: 'r1' }));
    (reviewRepo.count as jest.Mock).mockResolvedValue(1);
  };

  it('marks a review as a verified purchase when a won invoice exists', async () => {
    baseMocks();
    (invoiceRepo.findOne as jest.Mock).mockResolvedValue({ id: 'inv1' });

    await service.create('s1', 'u1', { rating: 5, auction_id: 'a1' } as any);

    expect(reviewRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ is_verified_purchase: true }),
    );
    expect(invoiceRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ seller_id: 's1', buyer_id: 'u1', auction_id: 'a1' }) }),
    );
  });

  it('marks a review as unverified when no won invoice exists', async () => {
    baseMocks();
    (invoiceRepo.findOne as jest.Mock).mockResolvedValue(null);

    await service.create('s1', 'u1', { rating: 4, product_id: 'p1' } as any);

    expect(reviewRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ is_verified_purchase: false }),
    );
  });

  it('blocks a seller from reviewing their own profile', async () => {
    (sellerRepo.findOne as jest.Mock).mockResolvedValue({ id: 's1', user_id: 'u1' });

    await expect(service.create('s1', 'u1', { rating: 5 } as any)).rejects.toThrow(
      ForbiddenException,
    );
    expect(reviewRepo.save).not.toHaveBeenCalled();
  });

  describe('helpful votes', () => {
    const review = () => ({
      id: 'r1',
      seller_id: 's1',
      helpful_count: 0,
      markHelpful: function () { this.helpful_count += 1; },
    });

    it('blocks the profile owner from voting on their own reviews', async () => {
      (reviewRepo.findOne as jest.Mock).mockResolvedValue(review());
      (sellerRepo.findOne as jest.Mock).mockResolvedValue({ id: 's1', user_id: 'owner' });

      await expect(service.markHelpful('r1', 'owner')).rejects.toThrow(ForbiddenException);
      expect(reviewRepo.save).not.toHaveBeenCalled();
    });

    it('records a vote from any other signed-in user', async () => {
      const r = review();
      (reviewRepo.findOne as jest.Mock).mockResolvedValue(r);
      (sellerRepo.findOne as jest.Mock).mockResolvedValue({ id: 's1', user_id: 'owner' });
      (reviewRepo.save as jest.Mock).mockImplementation(async (x) => x);

      const res = await service.markHelpful('r1', 'voter');
      expect(res.helpful_count).toBe(1);
    });
  });
});
