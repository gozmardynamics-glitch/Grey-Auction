import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SellerStatisticsService } from './seller-statistics.service';
import { SellerStatistics, StatisticsPeriod } from '../entities/seller-statistics.entity';
import { Seller } from '../entities/seller.entity';
import { Product } from '../../products/entities/product.entity';
import { Invoice } from '../../invoices/invoice.entity';
import { SellerReview } from '../entities/seller-review.entity';

describe('SellerStatisticsService', () => {
  let service: SellerStatisticsService;
  const statsRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const sellerRepo = { findOne: jest.fn() };
  const productRepo = { find: jest.fn() };
  const invoiceRepo = { find: jest.fn() };
  const reviewRepo = { find: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerStatisticsService,
        { provide: getRepositoryToken(SellerStatistics), useValue: statsRepo },
        { provide: getRepositoryToken(Seller), useValue: sellerRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(Invoice), useValue: invoiceRepo },
        { provide: getRepositoryToken(SellerReview), useValue: reviewRepo },
      ],
    }).compile();
    service = module.get<SellerStatisticsService>(SellerStatisticsService);
  });

  it('generate populates metrics from invoices/products/reviews', async () => {
    const periodStart = new Date('2026-01-01T00:00:00Z');
    const periodEnd = new Date('2026-01-31T23:59:59Z');
    const stats: any = {
      seller_id: 's1',
      period_type: StatisticsPeriod.MONTHLY,
      period_start: periodStart,
      period_end: periodEnd,
      calculateMetrics: jest.fn(),
    };

    (sellerRepo.findOne as jest.Mock).mockResolvedValue({ id: 's1', user_id: 'u1' });
    (statsRepo.findOne as jest.Mock).mockResolvedValue(null);
    (statsRepo.create as jest.Mock).mockReturnValue(stats);
    (statsRepo.save as jest.Mock).mockImplementation(async (s: any) => ({ ...s, id: 'st1' }));
    (invoiceRepo.find as jest.Mock).mockResolvedValue([
      { product_id: 'p1', buyer_id: 'b1', status: 'paid', hammer_price: '50000', commission: '5000' },
      { product_id: 'p1', buyer_id: 'b2', status: 'issued', hammer_price: '20000', commission: '2000' },
    ]);
    (productRepo.find as jest.Mock).mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
    (reviewRepo.find as jest.Mock).mockResolvedValue([{ rating: 5 }, { rating: 2 }]);

    const result = await service.generate('s1', StatisticsPeriod.MONTHLY, periodStart, periodEnd);

    expect(result.total_orders).toBe(2);
    expect(result.total_sales).toBe(70000);
    expect(result.gross_revenue).toBe(70000);
    expect(result.commission_paid).toBe(7000);
    expect(result.net_revenue).toBe(63000);
    expect(result.completed_orders).toBe(1);
    expect(result.products_sold).toBe(1);
    expect(result.unique_customers).toBe(2);
    expect(result.products_listed).toBe(2);
    expect(result.reviews_received).toBe(2);
    expect(result.average_rating).toBe(3.5);
  });
});
