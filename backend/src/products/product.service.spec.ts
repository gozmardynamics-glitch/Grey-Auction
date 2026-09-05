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
      createQueryBuilder: jest.fn(),
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

  describe('getArmCounts', () => {
    const qbChain = (rows: Array<{ subCategory: string | null; count: string }>) => {
      const builder: Record<string, jest.Mock> = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.addSelect = jest.fn().mockReturnValue(builder);
      builder.where = jest.fn().mockReturnValue(builder);
      builder.andWhere = jest.fn().mockReturnValue(builder);
      builder.groupBy = jest.fn().mockReturnValue(builder);
      builder.getRawMany = jest.fn().mockResolvedValue(rows);
      return builder;
    };

    it('aggregates ACTIVE lot counts per subcategory server-side', async () => {
      const builder = qbChain([
        { subCategory: 'Federal', count: '7' },
        { subCategory: 'State', count: '3' },
        { subCategory: null, count: '2' },
      ]);
      (productRepository.createQueryBuilder as jest.Mock).mockReturnValue(builder);

      const result = await service.getArmCounts('Government');

      expect(productRepository.createQueryBuilder).toHaveBeenCalledWith('product');
      expect(builder.where).toHaveBeenCalledWith(
        'product.status = :status',
        expect.objectContaining({ status: ProductStatus.ACTIVE }),
      );
      expect(builder.andWhere).toHaveBeenCalledWith(
        'product.category = :category',
        expect.objectContaining({ category: 'Government' }),
      );
      expect(builder.groupBy).toHaveBeenCalledWith('product.subCategory');
      expect(result).toEqual({
        category: 'Government',
        counts: { Federal: 7, State: 3, '': 2 },
      });
    });

    it('returns empty counts when the category has no active lots', async () => {
      (productRepository.createQueryBuilder as jest.Mock).mockReturnValue(qbChain([]));

      const result = await service.getArmCounts('Empty');
      expect(result.counts).toEqual({});
    });
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

      expect(productRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          sellerId: 'seller-1',
          status: ProductStatus.DRAFT,
        }),
      );
      // A slug is auto-generated on create
      const createArg = (productRepository.create as jest.Mock).mock.calls[0][0];
      expect(createArg.slug).toBeDefined();
      expect(createArg.slug).toMatch(/^new-product-[a-z0-9]{4}$/);
      expect(productRepository.save).toHaveBeenCalledWith(createdProduct);
      expect(result).toEqual(createdProduct);
    });

    it('should generate a URL-safe slug', () => {
      expect(service.generateSlug('Hello World! Auction')).toMatch(
        /^hello-world-auction-[a-z0-9]{4}$/,
      );
      expect(service.generateSlug('  Spaces   & symbols  ')).toMatch(
        /^spaces-symbols-[a-z0-9]{4}$/,
      );
    });
  });

  describe('findByIdOrSlug', () => {
    const uuid = '5f5e818e-b1ee-4e25-ae8e-d503cc497657';
    const slug = 'macbook-pro-16-m3-9fbe';

    it('should look up by UUID first', async () => {
      (productRepository.findOne as jest.Mock).mockResolvedValue(mockProduct);

      await service.findByIdOrSlug(uuid);

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: uuid },
        relations: ['seller'],
      });
    });

    it('should look up by slug when the value is not a UUID', async () => {
      (productRepository.findOne as jest.Mock).mockResolvedValue(mockProduct);

      await service.findByIdOrSlug(slug);

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { slug },
        relations: ['seller'],
      });
    });

    it('should throw NotFoundException when neither id nor slug matches', async () => {
      (productRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findByIdOrSlug('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getRelated', () => {
    it('should query active products in the same category', async () => {
      (productRepository.find as jest.Mock).mockResolvedValue([mockProduct]);

      await service.getRelated('Electronics', 'exclude-id', 4);

      expect(productRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ProductStatus.ACTIVE,
            category: 'Electronics',
            id: expect.anything(),
          }),
          take: 4,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should default to ACTIVE status for public listing', async () => {
      (productRepository.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 20 });

      expect(productRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: ProductStatus.ACTIVE }),
        }),
      );
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

  describe('bulkCreate (L9 CSV enhancements)', () => {
    it('creates a product with multiple images, tags and price tiers', async () => {
      (productRepository.create as jest.Mock).mockImplementation((p: any) => p);
      (productRepository.save as jest.Mock).mockImplementation(async (p: any) => ({ ...p, id: 'p1' }));
      const rows = [
        {
          title: 'Watch',
          starting_bid: '100',
          images: 'https://a.com/1.jpg|https://b.com/2.jpg',
          tags: 'luxury|watch',
          reserve_price: '200',
          buy_now_price: '500',
          sub_category: 'Watches',
        },
      ];

      const result = await service.bulkCreate(rows as any, 'seller-1');

      expect(result.created).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      const created = (productRepository.save as jest.Mock).mock.calls[0][0];
      expect(created.images).toEqual(['https://a.com/1.jpg', 'https://b.com/2.jpg']);
      expect(created.tags).toEqual(['luxury', 'watch']);
      expect(created.hasReservePrice).toBe(true);
      expect(created.reservePrice).toBe(200);
      expect(created.buyNowPrice).toBe(500);
      expect(created.allowBuyNow).toBe(true);
      expect(created.subCategory).toBe('Watches');
    });

    it('records a row error when the title is missing', async () => {
      const result = await service.bulkCreate([{ starting_bid: '100' } as any], 'seller-1');
      expect(result.created).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('title');
    });
  });
});
