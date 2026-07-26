import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BidService } from './bid.service';
import { Bid } from './entities/bid.entity';
import { ProductService } from '../products/product.service';
import { AuctionGateway } from './gateways/auction.gateway';

describe('BidService', () => {
  let service: BidService;
  let bidRepository: jest.Mocked<Partial<Repository<Bid>>>;
  let productService: jest.Mocked<Partial<ProductService>>;
  let gateway: jest.Mocked<Partial<AuctionGateway>>;

  const mockProduct = {
    id: 'product-1',
    startingBid: 100,
    currentBid: 150,
    totalBids: 3,
  };

  const mockBid: Partial<Bid> = {
    id: 'bid-1',
    productId: 'product-1',
    bidderId: 'user-1',
    amount: 200,
    isWinningBid: true,
    createdAt: new Date(),
    product: { totalBids: 4 } as any,
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BidService,
        { provide: getRepositoryToken(Bid), useValue: bidRepository },
        { provide: ProductService, useValue: productService },
        { provide: AuctionGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<BidService>(BidService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('placeBid', () => {
    const placeBidDto = { amount: 200 };

    it('should place a bid successfully', async () => {
      (productService.findById as jest.Mock).mockResolvedValue(mockProduct);
      (bidRepository.update as jest.Mock).mockResolvedValue({});
      (bidRepository.create as jest.Mock).mockReturnValue(mockBid);
      (bidRepository.save as jest.Mock).mockResolvedValue(mockBid);
      (productService.updateBid as jest.Mock).mockResolvedValue(undefined);

      const result = await service.placeBid('product-1', 'user-1', placeBidDto);

      expect(productService.findById).toHaveBeenCalledWith('product-1');
      expect(bidRepository.update).toHaveBeenCalledWith(
        { productId: 'product-1', isWinningBid: true },
        { isWinningBid: false },
      );
      expect(bidRepository.create).toHaveBeenCalledWith({
        productId: 'product-1',
        bidderId: 'user-1',
        amount: 200,
        isWinningBid: true,
      });
      expect(bidRepository.save).toHaveBeenCalled();
      expect(productService.updateBid).toHaveBeenCalledWith('product-1', 200);
      expect(gateway.broadcastNewBid).toHaveBeenCalledWith('product-1', mockBid);
      expect(result).toEqual(mockBid);
    });

    it('should throw BadRequestException when bid is below current bid', async () => {
      (productService.findById as jest.Mock).mockResolvedValue(mockProduct);

      await expect(service.placeBid('product-1', 'user-1', { amount: 100 })).rejects.toThrow(BadRequestException);
      expect(bidRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when bid is below starting bid', async () => {
      (productService.findById as jest.Mock).mockResolvedValue({ ...mockProduct, currentBid: 0 });

      await expect(service.placeBid('product-1', 'user-1', { amount: 50 })).rejects.toThrow(BadRequestException);
      expect(bidRepository.save).not.toHaveBeenCalled();
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
      });
      expect(result).toEqual(bids);
    });

    it('should return empty array when user has no bids', async () => {
      (bidRepository.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getUserBids('user-1');

      expect(result).toEqual([]);
    });
  });
});
