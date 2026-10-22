import { Injectable, NotFoundException, BadRequestException, Optional, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, Not, EntityManager } from 'typeorm';
import { Product, ProductStatus } from './entities/product.entity';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, ApproveProductDto, RejectProductDto } from './dto/product.dto';
import { ListingModerationService, ModerationVerdict } from '../common/typesafe/listing-moderation.service';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
    @Optional()
    private readonly moderation?: ListingModerationService,
  ) {}

  async create(dto: CreateProductDto, sellerId: string): Promise<Product> {
    const product = this.repo.create({
      ...dto,
      sellerId,
      slug: this.generateSlug(dto.title),
      status: ProductStatus.DRAFT,
      // U5 invariant: auctionType is fixed when the lot is approved, not before
      auctionType: undefined,
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
    const { status, category, subCategory, search, page = 1, limit = 20, auctionType, allowBuyNow } = query;
    const where: any = {};

    if (status) where.status = status;
    else where.status = ProductStatus.ACTIVE;
    if (category) where.category = category;
    if (subCategory) where.subCategory = subCategory;
    if (auctionType) where.auctionType = auctionType;
    if (allowBuyNow !== undefined) where.allowBuyNow = allowBuyNow;

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

  /**
   * Server-served per-arm (subcategory) counts for the institutional-arm tabs
   * (Government / Embassy / Corporate). One GROUP BY query over ACTIVE lots in
   * the category — replaces the client-side bounded aggregate so tab counts
   * stay accurate no matter how large the inventory grows. The '' key counts
   * lots without a subcategory (the "All" tab remainder).
   */
  async getArmCounts(
    category: string,
  ): Promise<{ category: string; counts: Record<string, number> }> {
    const rows: Array<{ subCategory: string | null; count: string | number }> =
      await this.repo
        .createQueryBuilder('product')
        .select('product.subCategory', 'subCategory')
        .addSelect('COUNT(*)', 'count')
        .where('product.status = :status', { status: ProductStatus.ACTIVE })
        .andWhere('product.category = :category', { category })
        .groupBy('product.subCategory')
        .getRawMany();
    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.subCategory ?? ''] = Number(row.count) || 0;
    }
    return { category, counts };
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

      // L9: support multiple image URLs, price tiers and tags from the CSV.
      const images = this.parseList(r.images || r.image_urls || r.image_url);
      const tags = this.parseList(r.tags);
      const reservePrice = r.reserve_price ? Number(r.reserve_price) : undefined;
      const buyNowPrice = r.buy_now_price ? Number(r.buy_now_price) : undefined;

      const product = await this.repo.save(
        this.repo.create({
          title: r.title,
          description: r.description || '',
          startingBid,
          currentBid: 0,
          category: r.category || 'Other',
          subCategory: r.sub_category || undefined,
          images: images.length ? images : ['/placeholder.svg'],
          tags: tags.length ? tags : undefined,
          reservePrice,
          hasReservePrice: reservePrice !== undefined,
          buyNowPrice,
          allowBuyNow: buyNowPrice !== undefined,
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

  /** Split a pipe/comma-separated CSV field into a trimmed, non-empty list. */
  private parseList(value?: string): string[] {
    if (!value) return [];
    return value
      .split(/[|,]/)
      .map((s) => s.trim())
      .filter(Boolean);
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

    // U5 answer #4 — the escrow auto-release window is FIXED AT CREATION once
    // the lot is live (active/sold/etc). Drafts and pending-approval lots may
    // still edit it.
    if (
      dto.escrowReleaseHours !== undefined &&
      product.status !== ProductStatus.DRAFT &&
      product.status !== ProductStatus.PENDING_APPROVAL &&
      product.status !== ProductStatus.REJECTED &&
      Number(dto.escrowReleaseHours) !== Number(product.escrowReleaseHours ?? 72)
    ) {
      throw new BadRequestException(
        'The escrow release window is fixed at auction creation and can no longer be changed',
      );
    }

    Object.assign(product, dto);
    return this.repo.save(product);
  }

  async remove(id: string, sellerId: string): Promise<void> {
    const product = await this.findById(id);
    if (product.sellerId !== sellerId) throw new BadRequestException('Not your product');
    await this.repo.remove(product);
  }

  /**
   * Run AI moderation on a listing without changing its status. Used by the
   * admin UI to preview a verdict before approving.
   */
  async moderate(id: string): Promise<ModerationVerdict> {
    const product = await this.findById(id);
    if (!this.moderation) {
      return { evaluated: false, decision: 'review', maxProbability: 0, rules: [] };
    }
    return this.moderation.moderateListing({
      title: product.title,
      description: product.description,
      category: product.category,
      specifications: product.specifications,
    });
  }

  async approve(id: string, dto: ApproveProductDto, adminId: string): Promise<Product> {
    const product = await this.findById(id);

    // Gate publishing on AI moderation. A rejection blocks the listing unless
    // an admin explicitly overrides after reviewing the flag; a `review` verdict
    // is advisory (logged) so it never stalls the queue silently.
    const verdict = await this.moderate(id);
    if (verdict.decision === 'reject' && !dto.force) {
      const fired = verdict.rules
        .filter((r) => r.triggered)
        .map((r) => `${r.label} (${(r.probability * 100).toFixed(0)}%)`)
        .join(', ');
      throw new BadRequestException(
        'AI moderation blocked this listing: ' +
          fired +
          '. Review the content, or resend with force=true to publish anyway.',
      );
    }
    if (verdict.decision === 'reject' && dto.force) {
      this.logger.warn(
        `Admin ${adminId} overrode moderation rejection for product ${id} (${product.title})`,
      );
    }

    product.status = ProductStatus.ACTIVE;
    product.approvedBy = adminId;
    product.approvedAt = new Date();
    // U5 invariant: the auction type is locked exactly once, at approval.
    if (dto.auctionType) product.auctionType = dto.auctionType;
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
