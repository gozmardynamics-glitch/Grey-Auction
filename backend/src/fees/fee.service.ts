import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeConfig } from './fee-config.entity';

export interface UpsertFeeDto {
  category?: string;
  displayName?: string;
  commissionPct?: number;
  vatPct?: number;
  otherChargesPct?: number;
  fixedFee?: number;
  isActive?: boolean;
}

@Injectable()
export class FeeService {
  constructor(
    @InjectRepository(FeeConfig)
    private readonly repo: Repository<FeeConfig>,
  ) {}

  async findAll(): Promise<FeeConfig[]> {
    return this.repo.find({ order: { category: 'ASC' } });
  }

  async findByCategory(category: string): Promise<FeeConfig> {
    const config = await this.repo.findOne({ where: { category } });
    if (config) return config;
    // Fall back to default
    const fallback = await this.repo.findOne({ where: { category: 'default' } });
    if (!fallback) {
      throw new NotFoundException('No fee configuration found');
    }
    return fallback;
  }

  async upsert(dto: UpsertFeeDto): Promise<FeeConfig> {
    const category = dto.category || 'default';
    let config = await this.repo.findOne({ where: { category } });

    if (!config) {
      config = this.repo.create({ category });
    }

    if (dto.displayName !== undefined) config.displayName = dto.displayName;
    if (dto.commissionPct !== undefined) config.commissionPct = dto.commissionPct;
    if (dto.vatPct !== undefined) config.vatPct = dto.vatPct;
    if (dto.otherChargesPct !== undefined) config.otherChargesPct = dto.otherChargesPct;
    if (dto.fixedFee !== undefined) config.fixedFee = dto.fixedFee;
    if (dto.isActive !== undefined) config.isActive = dto.isActive;

    return this.repo.save(config);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async getBreakdown(amount: number, category?: string): Promise<any> {
    const config = await this.findByCategory(category || 'default');
    const breakdown = config.calculateBreakdown(amount);
    return {
      ...breakdown,
      rates: {
        commissionPct: Number(config.commissionPct),
        vatPct: Number(config.vatPct),
        otherChargesPct: Number(config.otherChargesPct),
        fixedFee: Number(config.fixedFee),
      },
    };
  }

  /**
   * Seed default configuration on module init.
   */
  async seedDefaults(): Promise<void> {
    const existing = await this.repo.findOne({ where: { category: 'default' } });
    if (!existing) {
      await this.repo.save(
        this.repo.create({
          category: 'default',
          displayName: 'Platform Default',
          commissionPct: 10,
          vatPct: 7.5,
          otherChargesPct: 0,
          fixedFee: 0,
        }),
      );
    }
  }
}
