import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SellerService } from './seller.service';
import { Seller } from '../entities/seller.entity';
import { Product } from '../../products/entities/product.entity';
import { Invoice } from '../../invoices/invoice.entity';

describe('SellerService', () => {
  let service: SellerService;
  const sellerRepo = { findOne: jest.fn() };
  const productRepo = { find: jest.fn() };
  const invoiceRepo = { find: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerService,
        { provide: getRepositoryToken(Seller), useValue: sellerRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(Invoice), useValue: invoiceRepo },
      ],
    }).compile();
    service = module.get<SellerService>(SellerService);
  });

  it('getRecentActivity merges invoices + products newest-first', async () => {
    (invoiceRepo.find as jest.Mock).mockResolvedValue([
      {
        id: 'i1',
        invoice_number: 'INV-1',
        hammer_price: '50000',
        status: 'paid',
        created_at: new Date('2026-08-02T10:00:00Z'),
      },
    ]);
    (productRepo.find as jest.Mock).mockResolvedValue([
      {
        id: 'p1',
        title: 'Rolex',
        slug: 'rolex',
        status: 'active',
        createdAt: new Date('2026-08-01T09:00:00Z'),
      },
    ]);

    const activity = await service.getRecentActivity('user-1');

    // Invoice is newer so it comes first.
    expect(activity[0].type).toBe('invoice');
    expect(activity[0].title).toBe('Invoice INV-1');
    expect(activity[1].type).toBe('product');
    expect(activity[1].title).toBe('Rolex');
    expect(activity[1].link).toBe('/auctions/rolex');
    expect(invoiceRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { seller_id: 'user-1' } }),
    );
    expect(productRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sellerId: 'user-1' } }),
    );
  });

  it('getRecentActivity returns an empty list when the seller has nothing', async () => {
    (invoiceRepo.find as jest.Mock).mockResolvedValue([]);
    (productRepo.find as jest.Mock).mockResolvedValue([]);

    const activity = await service.getRecentActivity('user-1');
    expect(activity).toEqual([]);
  });

  it('getDashboard includes the derived recent activity', async () => {
    (sellerRepo.findOne as jest.Mock).mockResolvedValue({
      id: 's1',
      user_id: 'user-1',
      total_sales: 1000,
      total_products: 2,
      active_products: 1,
      total_orders: 1,
      completed_orders: 1,
      rating: 5,
      total_reviews: 1,
      completion_rate: 100,
    });
    (invoiceRepo.find as jest.Mock).mockResolvedValue([]);
    (productRepo.find as jest.Mock).mockResolvedValue([]);

    const dash = await service.getDashboard('s1');

    expect(dash.recent_activity).toEqual([]);
    expect(dash.stats.total_sales).toBe(1000);
  });
});
