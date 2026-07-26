import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProductService } from './product.service';
import { Product, ProductStatus } from './entities/product.entity';

describe('ProductService', () => {
  let service: ProductService;
  let productRepository: jest.Mocked<Partial<Repository<Product>>>;

  const mockProduct: Partial<Product> = {
    id: 'product-1',
    title: 'Test Product',
    description: 'A test product',
    startingBid: 100,
    currentBid: 0,
    category: 'Electronics',
    sellerId: 'seller-1',
    status: ProductStatus.DRAFT,
    totalBids: 0,
    endTime: new Date('2026-12-31'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    productRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getRepositoryToken(Product), useValue: productRepository },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return products with pagination', async () => {
      const mockData = [mockProduct];
      const mockTotal = 1;
      (productRepository.findAndCount as jest.Mock).mockResolvedValue([mockData, mockTotal]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(productRepository.findAndCount).toHaveBeenCalled();
      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(mockTotal);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should apply status filter when provided', async () => {
      (productRepository.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAll({ status: ProductStatus.ACTIVE, page: 1, limit: 20 });

      expect(productRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: ProductStatus.ACTIVE }),
        }),
      );
    });

    it('should apply search filter when provided', async () => {
      (productRepository.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAll({ search: 'test', page: 1, limit: 20 });

      expect(productRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Array),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a product when found', async () => {
      (productRepository.findOne as jest.Mock).mockResolvedValue(mockProduct);

      const result = await service.findById('product-1');

      expect(result).toEqual(mockProduct);
      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        relations: ['seller'],
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      (productRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a product', async () => {
      const createDto = {
        title: 'New Product',
        startingBid: 50,
        category: 'Art',
        endTime: '2026-12-31T00:00:00Z',
      };
      const createdProduct = { ...mockProduct, ...createDto };
      (productRepository.create as jest.Mock).mockReturnValue(createdProduct);
      (productRepository.save as jest.Mock).mockResolvedValue(createdProduct);

      const result = await service.create(createDto as any, 'seller-1');

      expect(productRepository.create).toHaveBeenCalledWith({
        ...createDto,
        sellerId: 'seller-1',
        status: ProductStatus.DRAFT,
      });
      expect(productRepository.save).toHaveBeenCalledWith(createdProduct);
      expect(result).toEqual(createdProduct);
    });
  });

  describe('update', () => {
    it('should update a product when owner matches', async () => {
      const updateDto = { title: 'Updated Title' };
      const updatedProduct = { ...mockProduct, ...updateDto };
      (productRepository.findOne as jest.Mock).mockResolvedValue(mockProduct);
      (productRepository.save as jest.Mock).mockResolvedValue(updatedProduct);

      const result = await service.update('product-1', updateDto as any, 'seller-1');

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        relations: ['seller'],
      });
      expect(productRepository.save).toHaveBeenCalled();
      expect(result.title).toBe('Updated Title');
    });

    it('should throw BadRequestException when user is not the owner', async () => {
      (productRepository.findOne as jest.Mock).mockResolvedValue(mockProduct);

      await expect(service.update('product-1', { title: 'Hacked' } as any, 'other-seller'))
        .rejects.toThrow(BadRequestException);
      expect(productRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('approve', () => {
    it('should approve a product', async () => {
      (productRepository.findOne as jest.Mock).mockResolvedValue(mockProduct);
      (productRepository.save as jest.Mock).mockResolvedValue({ ...mockProduct, status: ProductStatus.ACTIVE });

      const result = await service.approve('product-1', { notes: 'Looks good' } as any, 'admin-1');

      expect(productRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(ProductStatus.ACTIVE);
    });

    it('should set approvedBy and approvedAt on approval', async () => {
      (productRepository.findOne as jest.Mock).mockResolvedValue(mockProduct);
      (productRepository.save as jest.Mock).mockImplementation((p: Product) => Promise.resolve(p));

      const result = await service.approve('product-1', {} as any, 'admin-1');

      expect(result.approvedBy).toBe('admin-1');
      expect(result.approvedAt).toBeInstanceOf(Date);
    });
  });

  describe('reject', () => {
    it('should reject a product with rejection reason', async () => {
      (productRepository.findOne as jest.Mock).mockResolvedValue(mockProduct);
      (productRepository.save as jest.Mock).mockImplementation((p: Product) => Promise.resolve(p));

      const result = await service.reject('product-1', { rejectionReason: 'Not allowed' } as any, 'admin-1');

      expect(result.status).toBe(ProductStatus.REJECTED);
      expect(result.rejectionReason).toBe('Not allowed');
      expect(productRepository.save).toHaveBeenCalled();
    });
  });
});
