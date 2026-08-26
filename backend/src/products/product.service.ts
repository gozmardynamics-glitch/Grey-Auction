import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, Not, EntityManager } from 'typeorm';
import { Product, ProductStatus } from './entities/product.entity';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, ApproveProductDto, RejectProductDto } from './dto/product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto, sellerId: string): Promise<Product> {
    const product = this.repo.create({
      ...dto,
      sellerId,
      slug: this.generateSlug(dto.title),
      status: ProductStatus.DRAFT,
    });
    return this.repo.save(product);
  }

  /**
   * Slugify a title into a URL-safe slug with a short random suffix
   * so it stays unique across listings.
   */
  generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
    const suffix = Math.random().toString(36).slice(2, 6);
    return base ? base + '-' + suffix : 'item-' + suffix;
  }

  async findAll(query: ProductQueryDto) {
    // Public listing defaults to ACTIVE auctions unless a status is requested
    const { status, category, search, page = 1, limit = 20 } = query;
    const where: any = {};

    if (status) where.status = status;
    else where.status = ProductStatus.ACTIVE;
    if (category) where.category = category;

    const [data, total] = await this.repo.findAndCount({
      where: search
        ? [
            { ...where, title: ILike(`%${search}%`) },
            { ...where, description: ILike(`%${search}%`) },
          ]
        : where,
      relations: ['seller'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Product> {
    const product = await this.repo.findOne({ where: { id }, relations: ['seller'] });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findByIdWithLock(id: string, manager?: EntityManager): Promise<Product> {
    const repo = manager ? manager.getRepository(Product) : this.repo;
    const product = await repo.findOne({
      where: { id },
      relations: ['seller'],
      lock: { mode: 'pessimistic_write' },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findByIdOrSlug(idOrSlug: string): Promise<Product> {
    // Only match the id column when the value is actually a UUID; a raw slug
    // in the id column would raise an invalid-uuid error on PostgreSQL.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug,
    );
    let product: Product | null = null;
    if (isUuid) {
      product = await this.repo.findOne({
        where: { id: idOrSlug },
        relations: ['seller'],
      });
    }
    if (!product) {
      product = await this.repo.findOne({
        where: { slug: idOrSlug },
        relations: ['seller'],
      });
    }
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findBySlug(id: string): Promise<Product> {
    return this.findByIdOrSlug(id);
  }

  async getRelated(category: string, excludeId?: string, take = 4): Promise<Product[]> {
    const where: any = { status: ProductStatus.ACTIVE };
    if (category) where.category = category;
    if (excludeId) where.id = Not(excludeId);
    return this.repo.find({
      where,
      relations: ['seller'],
      order: { totalBids: 'DESC' },
      take,
    });
  }

  /**
   * Bulk-create products from parsed CSV rows.
   * Each row may provide: title*, description, starting_bid*, category,
   * sub_category, end_time (ISO), city, country, country_code.
   * Returns created products plus per-row errors for invalid rows.
   */
  async bulkCreate(
    rows: Record<string, string>[],
    sellerId: string,
  ): Promise<{ created: Product[]; errors: { row: number; message: string }[] }> {
    const created: Product[] = [];
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      const rowNumber = i + 2; // 1-based accounting for the header row

      if (!r.title || r.title.length < 2) {
        errors.push({ row: rowNumber, message: 'title is required (min 2 chars)' });
        continue;
      }
      const startingBid = Number(r.starting_bid);
      if (!r.starting_bid || Number.isNaN(startingBid) || startingBid < 0) {
        errors.push({ row: rowNumber, message: 'starting_bid must be a positive number' });
        continue;
      }

      const endTime = r.end_time
        ? new Date(r.end_time)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      if (Number.isNaN(endTime.getTime())) {
        errors.push({ row: rowNumber, message: 'end_time must be a valid ISO date' });
        continue;
      }

      const product = await this.repo.save(
        this.repo.create({
          title: r.title,
          description: r.description || '',
          startingBid,
          currentBid: 0,
          category: r.category || 'Other',
          subCategory: r.sub_category || undefined,
          images: r.image_url ? [r.image_url] : ['/placeholder.svg'],
          endTime,
          status: ProductStatus.DRAFT,
          slug: this.generateSlug(r.title),
          sellerId,
          city: r.city || undefined,
          country: r.country || undefined,
          countryCode: r.country_code || undefined,
        }),
      );
      created.push(product);
    }

    return { created, errors };
  }

  async findBySeller(sellerId: string): Promise<Product[]> {
    return this.repo.find({
      where: { sellerId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async getFeatured() {
    return this.repo.find({
      where: { status: ProductStatus.ACTIVE },
      relations: ['seller'],
      order: { totalBids: 'DESC' },
      take: 12,
    });
  }

  async update(id: string, dto: UpdateProductDto, sellerId: string): Promise<Product> {
    const product = await this.findById(id);
    if (product.sellerId !== sellerId) throw new BadRequestException('Not your product');
    Object.assign(product, dto);
    return this.repo.save(product);
  }

  async remove(id: string, sellerId: string): Promise<void> {
    const product = await this.findById(id);
    if (product.sellerId !== sellerId) throw new BadRequestException('Not your product');
    await this.repo.remove(product);
  }

  async approve(id: string, dto: ApproveProductDto, adminId: string): Promise<Product> {
    const product = await this.findById(id);
    product.status = ProductStatus.ACTIVE;
    product.approvedBy = adminId;
    product.approvedAt = new Date();
    return this.repo.save(product);
  }

  async reject(id: string, dto: RejectProductDto, adminId: string): Promise<Product> {
    const product = await this.findById(id);
    product.status = ProductStatus.REJECTED;
    product.rejectionReason = dto.rejectionReason;
    return this.repo.save(product);
  }

  async updateBid(productId: string, amount: number, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(Product) : this.repo;
    await repo.update(productId, {
      currentBid: amount,
      totalBids: () => 'total_bids + 1',
    });
  }
}
