import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, Not, EntityManager } from 'typeorm';
import { Product, ProductStatus, AuctionType } from './entities/product.entity';
import { KycRiskService } from '../kyc/kyc-risk.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, ApproveProductDto, RejectProductDto, ProductSortBy } from './dto/product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
    private readonly kycRisk: KycRiskService,
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
    // Public listing: ALWAYS active lots. `status` used to be honoured from the
    // query, so ?status=DRAFT leaked unapproved lots to the street. The DTO
    // still accepts the field (old clients keep validating) but it is ignored.
    const { category, subCategory, search, country, minPrice, maxPrice, sortBy = ProductSortBy.NEWEST, page = 1, limit = 20, auctionType, allowBuyNow } = query;
    const where: any = {};

    where.status = ProductStatus.ACTIVE;
    if (category) where.category = category;
    if (subCategory) where.subCategory = subCategory;
    if (country) where.country = country;
    if (auctionType) where.auctionType = auctionType;
    if (allowBuyNow !== undefined) where.allowBuyNow = allowBuyNow;
    if (minPrice !== undefined) where.currentBid = { ...where.currentBid, gte: minPrice };
    if (maxPrice !== undefined) where.currentBid = { ...where.currentBid, lte: maxPrice };

    // Build order clause based on sortBy
    let order: any = { createdAt: 'DESC' };
    switch (sortBy) {
      case ProductSortBy.ENDING_SOON:
        order = { endTime: 'ASC' };
        break;
      case ProductSortBy.PRICE_ASC:
        order = { currentBid: 'ASC' };
        break;
      case ProductSortBy.PRICE_DESC:
        order = { currentBid: 'DESC' };
        break;
      case ProductSortBy.MOST_BIDS:
        order = { totalBids: 'DESC' };
        break;
      case ProductSortBy.HIGHEST_PRICE:
        order = { currentBid: 'DESC' };
        break;
      case ProductSortBy.NEWEST:
      default:
        order = { createdAt: 'DESC' };
        break;
    }

    const whereClause: any = where;

    // Full-text search: PostgreSQL tsvector/tsquery with relevance ranking.
    if (search) {
      // Shared filter predicate so the count query and the page query always
      // agree on which rows match.
      const applyFilters = (qb: ReturnType<Repository<Product>['createQueryBuilder']>) => {
        qb.where('product.status = :status', { status: ProductStatus.ACTIVE });
        if (category) qb.andWhere('product.category = :category', { category });
        if (subCategory) qb.andWhere('product.subCategory = :subCategory', { subCategory });
        if (country) qb.andWhere('product.country = :country', { country });
        if (auctionType) qb.andWhere('product.auctionType = :auctionType', { auctionType });
        if (allowBuyNow !== undefined) {
          qb.andWhere('product.allowBuyNow = :allowBuyNow', { allowBuyNow });
        }
        if (minPrice !== undefined) qb.andWhere('product.currentBid >= :minPrice', { minPrice });
        if (maxPrice !== undefined) qb.andWhere('product.currentBid <= :maxPrice', { maxPrice });
        qb.andWhere(
          `to_tsvector('english', COALESCE(product.title, '') || ' ' || COALESCE(product.description, '') || ' ' || COALESCE(product.category, ''))
           @@ plainto_tsquery('english', :search)`,
          { search },
        );
        return qb;
      };

      // Count separately: the ranked data query aliases a computed column, which
      // TypeORM's getManyAndCount() reinjects into a COUNT() and fails on.
      const total = await applyFilters(
        this.repo.createQueryBuilder('product'),
      ).getCount();

      const orderField =
        sortBy === ProductSortBy.ENDING_SOON ? 'product.endTime' :
        sortBy === ProductSortBy.PRICE_ASC ? 'product.currentBid' :
        sortBy === ProductSortBy.PRICE_DESC ? 'product.currentBid' :
        sortBy === ProductSortBy.MOST_BIDS ? 'product.totalBids' :
        sortBy === ProductSortBy.HIGHEST_PRICE ? 'product.currentBid' :
        'product.createdAt';
      const orderDirection =
        sortBy === ProductSortBy.PRICE_ASC || sortBy === ProductSortBy.ENDING_SOON
          ? 'ASC'
          : 'DESC';

      // Relevance expression, reused for both the projection and the ORDER BY.
      // Ordering by the "searchRank" alias fails: Postgres folds the unquoted
      // ORDER BY identifier to lowercase while the quoted alias keeps its case.
      const rankExpr = `ts_rank_cd(
        to_tsvector('english', COALESCE(product.title, '') || ' ' || COALESCE(product.description, '') || ' ' || COALESCE(product.category, '')),
        plainto_tsquery('english', :search)
      )`;

      const data = await applyFilters(
        this.repo.createQueryBuilder('product').leftJoinAndSelect('product.seller', 'seller'),
      )
        .addSelect(rankExpr, 'searchRank')
        .orderBy(rankExpr, 'DESC')
        .addOrderBy(orderField, orderDirection)
        // Raw offset/limit rather than skip/take: skip/take re-queries through a
        // DISTINCT-id subquery, which cannot resolve a computed column.
        // product.seller is many-to-one, so raw paging cannot duplicate rows.
        .offset((page - 1) * limit)
        .limit(limit)
        .getMany();

      return { data, total, page, limit };
    }

    // Non-search query - use simple findAndCount
    const [data, total] = await this.repo.findAndCount({
      where: whereClause,
      relations: ['seller'],
      order,
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

  /**
   * Listings owned by an account holder, in any status.
   *
   * Ownership is expressed by Product.sellerId, which points at the owning
   * account (a User) — there is no separate seller identity. Any authenticated
   * account holder can list, so this needs no Seller KYC record.
   */
  /** Owner-scoped listing feed, paginated (5.8): a big seller must not pull
    * every row they own in one response. */
  async findMine(userId: string, page = 1, limit = 50): Promise<{ items: Product[]; total: number }> {
    const [items, total] = await this.repo.findAndCount({
      where: { sellerId: userId },
      relations: ['seller'],
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 200),
      skip: (Math.max(page, 1) - 1) * Math.min(Math.max(limit, 1), 200),
    });
    return { items, total };
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

  async approve(id: string, dto: ApproveProductDto, adminId: string): Promise<Product> {
    const product = await this.findById(id);

    // Publishing gate: approving a lot makes it publicly bid-able, so the owner
    // must have passed KYC *and* been authorised to publish. Sellers can always
    // create and edit listings — this only blocks the public step.
    const gate = await this.kycRisk.canPublish(product.sellerId);
    if (!gate.allowed) {
      // Say which control clears this, otherwise the admin sees a wall and has to
      // guess between "verify the KYC documents" and "grant publishing consent".
      throw new ForbiddenException(
        `Lot cannot be published: ${gate.reason}. ` +
          'Approve the seller\u2019s KYC documents and grant publishing consent ' +
          '(Admin \u2192 KYC \u2192 publish decision) first.',
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
