import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConditionReport } from './entities/condition-report.entity';
import { Product } from '../products/entities/product.entity';
import { CreateConditionReportDto } from './dto/trust.dto';

@Injectable()
export class ConditionReportService {
  constructor(
    @InjectRepository(ConditionReport)
    private readonly repo: Repository<ConditionReport>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
  ) {}

  /** Only the lot's owner (seller) or an admin may file a report. */
  async create(productId: string, user: { id: string; role: string }, dto: CreateConditionReportDto) {
    const product = await this.products.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Only the listing seller or an admin can file a condition report');
    }

    const report = this.repo.create({
      productId,
      condition: dto.condition,
      grade: dto.grade,
      summary: dto.summary,
      defects: dto.defects ?? [],
      inspectedAtLocation: dto.inspectedAtLocation ?? null,
      reportedById: user.id,
      reporterName: dto.reporterName ?? null,
    });
    return this.repo.save(report);
  }

  /** Public: full inspection history for a lot (newest first). */
  async listForProduct(productId: string): Promise<ConditionReport[]> {
    return this.repo.find({ where: { productId }, order: { createdAt: 'DESC' }, take: 50 });
  }

  /** Public: the current (newest) report, or null. */
  async latestForProduct(productId: string): Promise<ConditionReport | null> {
    const [latest] = await this.repo.find({ where: { productId }, order: { createdAt: 'DESC' }, take: 1 });
    return latest ?? null;
  }
}
