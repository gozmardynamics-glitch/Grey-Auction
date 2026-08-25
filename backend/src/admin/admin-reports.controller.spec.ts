import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AdminReportsController } from './admin-reports.controller';
import { Product } from '../products/entities/product.entity';
import { Bid } from '../bids/entities/bid.entity';
import { Seller } from '../seller/entities/seller.entity';
import { Invoice } from '../invoices/invoice.entity';

describe('AdminReportsController', () => {
  let controller: AdminReportsController;
  const repos = {
    product: { findAndCount: jest.fn() },
    bid: { findAndCount: jest.fn() },
    seller: { findAndCount: jest.fn() },
    invoice: { findAndCount: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminReportsController],
      providers: [
        { provide: getRepositoryToken(Product), useValue: repos.product },
        { provide: getRepositoryToken(Bid), useValue: repos.bid },
        { provide: getRepositoryToken(Seller), useValue: repos.seller },
        { provide: getRepositoryToken(Invoice), useValue: repos.invoice },
        {
          provide: DataSource,
          useValue: { getRepository: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AdminReportsController>(AdminReportsController);
    jest.clearAllMocks();
  });

  it('should return auction report with total', async () => {
    (repos.product.findAndCount as jest.Mock).mockResolvedValue([
      [{ id: 'p1' }],
      1,
    ]);
    const res = await controller.auctions();
    expect(res.success).toBe(true);
    expect(res.data.total).toBe(1);
    expect(repos.product.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 }),
    );
  });

  it('should filter auctions by status', async () => {
    (repos.product.findAndCount as jest.Mock).mockResolvedValue([[], 0]);
    await controller.auctions('sold');
    expect(repos.product.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'sold' } }),
    );
  });

  it('should return bids report', async () => {
    (repos.bid.findAndCount as jest.Mock).mockResolvedValue([[{ id: 'b1' }], 1]);
    const res = await controller.bids();
    expect(res.data.total).toBe(1);
    expect(repos.bid.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ relations: ['product', 'bidder'] }),
    );
  });

  it('should return sellers report', async () => {
    (repos.seller.findAndCount as jest.Mock).mockResolvedValue([[{ id: 's1' }], 1]);
    const res = await controller.sellers();
    expect(res.data.total).toBe(1);
  });

  it('should return payments (invoices) report', async () => {
    (repos.invoice.findAndCount as jest.Mock).mockResolvedValue([[{ id: 'i1' }], 1]);
    const res = await controller.payments();
    expect(res.data.total).toBe(1);
    expect(repos.invoice.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ order: { issued_at: 'DESC' } }),
    );
  });
});
