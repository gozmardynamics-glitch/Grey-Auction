import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between } from 'typeorm';
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
      status: ProductStatus.DRAFT,
    });
    return this.repo.save(product);
  }

  async findAll(query: ProductQueryDto) {
    const { status, category, search, page = 1, limit = 20 } = query;
    const where: any = {};

    if (status) where.status = status;
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

  async findBySlug(id: string): Promise<Product> {
    return this.findById(id);
  }

  async findBySeller(sellerId: string): Promise<Product[]> {
    return this.repo.find({
      where: { sellerId },
      order: { createdAt: 'DESC' },
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

  async updateBid(productId: string, amount: number): Promise<void> {
    await this.repo.update(productId, {
      currentBid: amount,
      totalBids: () => 'total_bids + 1',
    });
  }
}
