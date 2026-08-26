import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  BidService,
  bidStep,
  resolveAutoBids,
  ANTI_SNIPE_WINDOW_MS,
  ANTI_SNIPE_EXTEND_MS,
} from './bid.service';
import { Bid } from './entities/bid.entity';
import { Product, ProductStatus } from '../products/entities/product.entity';
import { ProductService } from '../products/product.service';
import { AuctionGateway } from './gateways/auction.gateway';
import { NotificationService } from '../notification/notification.service';

describe('BidService', () => {
  let service: BidService;
  let bidRepository: jest.Mocked<Partial<Repository<Bid>>>;
  let productService: jest.Mocked<Partial<ProductService>>;
  let gateway: jest.Mocked<Partial<AuctionGateway>>;
  let dataSource: jest.Mocked<Partial<DataSource>>;
  let notificationMock: jest.Mocked<Partial<NotificationService>>;
  let manager: any;

  const mockProduct = {
    id: 'product-1',
    startingBid: 100,
    currentBid: 150,
    totalBids: 3,
    status: ProductStatus.ACTIVE,
    endTime: new Date(Date.now() + 60 * 60 * 1000),
  };

  const mockBid: Partial<Bid> = {
    id: 'bid-1',
    productId: 'product-1',
    bidderId: 'user-1',
    amount: 200,
    isWinningBid: true,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    bidRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    productService = {
      findById: jest.fn(),
      updateBid: jest.fn(),
    };

    gateway = {
      broadcastNewBid: jest.fn(),
      broadcastBidUpdate: jest.fn(),
    };

    notificationMock = {
      notifyOutbid: jest.fn().mockResolvedValue(undefined),
      notifyAuctionWon: jest.fn().mockResolvedValue(undefined),
      notifyAuctionEnded: jest.fn().mockResolvedValue(undefined),
      notifyRoomStarted: jest.fn().mockResolvedValue(undefined),
    };

    manager = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      }),
    };

    dataSource = {
      transaction: jest.fn().mockImplementation((cb: any) => cb(manager)),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BidService,
        { provide: getRepositoryToken(Bid), useValue: bidRepository },
        { provide: ProductService, useValue: productService },
        { provide: AuctionGateway, useValue: gateway },
        { provide: DataSource, useValue: dataSource },
        { provide: NotificationService, useValue: notificationMock },
      ],
    }).compile();

    service = module.get<BidService>(BidService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('placeBid', () => {
    const placeBidDto = { amount: 200 };

    it('should place a bid successfully within a transaction', async () => {
      (dataSource.transaction as jest.Mock).mockImplementation(async (cb: any) => {
        (manager.findOne as jest.Mock).mockResolvedValue(mockProduct);
        (manager.create as jest.Mock).mockReturnValue(mockBid);
        (manager.save as jest.Mock).mockResolvedValue(mockBid);
        (manager.update as jest.Mock).mockResolvedValue({});
        return cb(manager);
      });

      const result = await service.placeBid('product-1', 'user-1', placeBidDto);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(manager.findOne).toHaveBeenCalledWith(Product, {
        where: { id: 'product-1' },
        lock: { mode: 'pessimistic_write' },
      });
      expect(manager.update).toHaveBeenCalledWith(
        Bid, { productId: 'product-1', isWinningBid: true }, { isWinningBid: false },
      );
      expect(manager.create).toHaveBeenCalledWith(
        Bid,
        expect.objectContaining({
          productId: 'product-1',
          bidderId: 'user-1',
          amount: 200,
          isAutoBid: false,
          maxBid: null,
          isWinningBid: true,
        }),
      );
      expect(manager.save).toHaveBeenCalled();
      expect(gateway.broadcastNewBid).toHaveBeenCalledWith('product-1', mockBid);
      expect(result).toEqual(mockBid);
    });

    it('should throw BadRequestException when bid is below current bid', async () => {
      (dataSource.transaction as jest.Mock).mockImplementation(async (cb: any) => {
        (manager.findOne as jest.Mock).mockResolvedValue(mockProduct);
        return cb(manager);
      });

      await expect(service.placeBid('product-1', 'user-1', { amount: 100 })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when bid is below starting bid', async () => {
      (dataSource.transaction as jest.Mock).mockImplementation(async (cb: any) => {
        (manager.findOne as jest.Mock).mockResolvedValue({ ...mockProduct, currentBid: 0 });
        return cb(manager);
      });

      await expect(service.placeBid('product-1', 'user-1', { amount: 50 })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAuctionBids', () => {
    it('should return sorted bids for an auction', async () => {
      const bids = [mockBid, { ...mockBid, id: 'bid-2', amount: 180 }];
      (bidRepository.find as jest.Mock).mockResolvedValue(bids);

      const result = await service.getAuctionBids('product-1');

      expect(bidRepository.find).toHaveBeenCalledWith({
        where: { productId: 'product-1' },
        relations: ['bidder'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(bids);
    });

    it('should return empty array when no bids exist', async () => {
      (bidRepository.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getAuctionBids('product-1');

      expect(result).toEqual([]);
    });
  });

  describe('getUserBids', () => {
    it('should return user bid history', async () => {
      const bids = [mockBid];
      (bidRepository.find as jest.Mock).mockResolvedValue(bids);

      const result = await service.getUserBids('user-1');

      expect(bidRepository.find).toHaveBeenCalledWith({
        where: { bidderId: 'user-1' },
        relations: ['product', 'room'],
        order: { createdAt: 'DESC' },
        take: 100,
      });
      expect(result).toEqual(bids);
    });

    it('should return empty array when user has no bids', async () => {
      (bidRepository.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getUserBids('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('bidStep', () => {
    it('returns the correct minimum increment per price level', () => {
      expect(bidStep(500)).toBe(500);
      expect(bidStep(15000)).toBe(1000);
      expect(bidStep(75000)).toBe(2500);
      expect(bidStep(250000)).toBe(5000);
      expect(bidStep(750000)).toBe(10000);
      expect(bidStep(2500000)).toBe(25000);
      expect(bidStep(7500000)).toBe(50000);
      expect(bidStep(15000000)).toBe(100000);
    });
  });

  describe('resolveAutoBids (pure proxy engine)', () => {
    it('lets a higher ceiling win at second-highest ceiling + increment', () => {
      const resolved = resolveAutoBids(1000, 'A', [
        { bidderId: 'A', maxBid: 5000 },
        { bidderId: 'B', maxBid: 3000 },
      ]);
      // A (manual 1000, ceiling 5000) vs B (ceiling 3000) -> A wins at 3500
      expect(resolved).toHaveLength(1);
      expect(resolved[0].bidderId).toBe('A');
      expect(resolved[0].amount).toBe(3500);
      expect(resolved[0].maxBid).toBe(5000);
    });

    it('raises by one increment over a manual bidder with no ceiling', () => {
      const resolved = resolveAutoBids(1000, 'A', [
        { bidderId: 'B', maxBid: 5000 },
      ]);
      expect(resolved).toHaveLength(1);
      expect(resolved[0].bidderId).toBe('B');
      expect(resolved[0].amount).toBe(1500);
    });

    it('stops when the leader has no competitor left', () => {
      const resolved = resolveAutoBids(1500, 'B', [
        { bidderId: 'B', maxBid: 5000 },
      ]);
      expect(resolved).toHaveLength(0);
    });

    it('resolves multi-round counters correctly', () => {
      // A manual 1000 (no ceiling), B ceiling 5000, C ceiling 3000
      const resolved = resolveAutoBids(1000, 'A', [
        { bidderId: 'B', maxBid: 5000 },
        { bidderId: 'C', maxBid: 3000 },
      ]);
      // B should win at C's ceiling + increment = 3500
      expect(resolved.length).toBeGreaterThan(0);
      expect(resolved[resolved.length - 1].bidderId).toBe('B');
      expect(resolved[resolved.length - 1].amount).toBe(3500);
    });

    it('returns nothing when no ceilings exceed the current bid', () => {
      expect(resolveAutoBids(4000, 'A', [
        { bidderId: 'A', maxBid: 3000 },
      ])).toEqual([]);
    });
  });

  describe('placeBid auto-bid + anti-sniping', () => {
    it('places auto-bids when a max bid is set and competitors exist', async () => {
      (dataSource.transaction as jest.Mock).mockImplementation(async (cb: any) => {
        (manager.findOne as jest.Mock).mockResolvedValue(mockProduct);
        (manager.create as jest.Mock).mockReturnValue({ ...mockBid });
        (manager.save as jest.Mock).mockResolvedValue({ ...mockBid });
        (manager.update as jest.Mock).mockResolvedValue({});
        (manager.createQueryBuilder as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([
            { bidderId: 'user-1', maxBid: '3000' },
            { bidderId: 'user-2', maxBid: '2000' },
          ]),
        });
        return cb(manager);
      });

      const result = await service.placeBid('product-1', 'user-1', {
        amount: 1000,
        maxBid: 3000,
      });

      expect(result).toBeDefined();
      expect(manager.create).toHaveBeenCalledWith(
        Bid,
        expect.objectContaining({ isAutoBid: false, maxBid: 3000 }),
      );
      // user-2 ceiling 2000 vs user-1 ceiling 3000 -> user-1 raised to 2500
      expect(manager.create).toHaveBeenCalledWith(
        Bid,
        expect.objectContaining({ bidderId: 'user-1', isAutoBid: true, amount: 2500 }),
      );
    });

    it('extends endTime when a bid arrives inside the anti-snipe window', async () => {
      const soon = new Date(Date.now() + 30 * 1000); // 30s left
      // Fresh product: placeBid mutates currentBid, so never share the
      // module-level mockProduct across tests.
      const productSoon = {
        id: 'product-1',
        startingBid: 100,
        currentBid: 150,
        totalBids: 3,
        status: ProductStatus.ACTIVE,
        endTime: soon,
      };
      (dataSource.transaction as jest.Mock).mockImplementation(async (cb: any) => {
        (manager.findOne as jest.Mock).mockResolvedValue(productSoon);
        (manager.create as jest.Mock).mockReturnValue({ ...mockBid });
        (manager.save as jest.Mock).mockResolvedValue({ ...mockBid });
        (manager.update as jest.Mock).mockResolvedValue({});
        (manager.createQueryBuilder as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        });
        return cb(manager);
      });

      await service.placeBid('product-1', 'user-1', { amount: 200 });

      const saved = (manager.save as jest.Mock).mock.calls.map((c) => c[0]);
      const savedProduct = saved.find((s) => s && s.id === 'product-1');
      expect(savedProduct.endTime.getTime() - soon.getTime()).toBe(
        ANTI_SNIPE_EXTEND_MS,
      );
      expect(ANTI_SNIPE_EXTEND_MS).toBeGreaterThan(0);
      expect(ANTI_SNIPE_WINDOW_MS).toBeGreaterThan(0);
    });

    it('notifies the displaced bidder when a new bid outbids them', async () => {
      // placeBid mutates the product's currentBid, so use a fresh product object.
      const fresh = {
        id: 'product-1',
        startingBid: 100,
        currentBid: 150,
        totalBids: 3,
        status: ProductStatus.ACTIVE,
        endTime: new Date(Date.now() + 3600000),
      };
      const prevLeader = { id: 'bid-old', productId: 'product-1', bidderId: 'user-2', isWinningBid: true };
      (dataSource.transaction as jest.Mock).mockImplementation(async (cb: any) => {
        (manager.findOne as jest.Mock)
          .mockResolvedValueOnce(fresh)
          .mockResolvedValueOnce(prevLeader);
        (manager.create as jest.Mock).mockReturnValue({ ...mockBid, bidderId: 'user-1' });
        (manager.save as jest.Mock).mockResolvedValue({ ...mockBid, bidderId: 'user-1' });
        (manager.update as jest.Mock).mockResolvedValue({});
        return cb(manager);
      });

      await service.placeBid('product-1', 'user-1', { amount: 200 });

      expect(notificationMock.notifyOutbid).toHaveBeenCalledWith(
        'user-2',
        expect.objectContaining({ auctionId: 'product-1' }),
      );
    });

    it('does not notify a bidder when their own bid stays winning', async () => {
      const fresh = {
        id: 'product-1',
        startingBid: 100,
        currentBid: 150,
        totalBids: 3,
        status: ProductStatus.ACTIVE,
        endTime: new Date(Date.now() + 3600000),
      };
      (dataSource.transaction as jest.Mock).mockImplementation(async (cb: any) => {
        (manager.findOne as jest.Mock)
          .mockResolvedValueOnce(fresh)
          .mockResolvedValueOnce({ ...mockBid, bidderId: 'user-1' });
        (manager.create as jest.Mock).mockReturnValue({ ...mockBid, bidderId: 'user-1' });
        (manager.save as jest.Mock).mockResolvedValue({ ...mockBid, bidderId: 'user-1' });
        (manager.update as jest.Mock).mockResolvedValue({});
        return cb(manager);
      });

      await service.placeBid('product-1', 'user-1', { amount: 200 });

      expect(notificationMock.notifyOutbid).not.toHaveBeenCalled();
    });
  });
});
