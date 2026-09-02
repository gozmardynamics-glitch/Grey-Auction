import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeConfig } from './fee-config.entity';
import { FeeOverride, FeeOverrideScope } from './fee-override.entity';
import {
  VatBase,
  EffectiveFeeConfig,
  FeeBreakdown,
  computeFeeBreakdown,
} from './fee-breakdown';

export interface UpsertFeeDto {
  category?: string;
  displayName?: string;
  commissionPct?: number;
  vatPct?: number;
  vatBase?: VatBase;
  sellerCommissionPct?: number;
  buyerFeeEnabled?: boolean;
  sellerFeeEnabled?: boolean;
  otherChargesPct?: number;
  fixedFee?: number;
  isActive?: boolean;
}

export interface UpsertFeeOverrideDto {
  scope: FeeOverrideScope;
  scopeId: string;
  buyerFeePct?: number | null;
  buyerFeeEnabled?: boolean | null;
  sellerFeePct?: number | null;
  sellerFeeEnabled?: boolean | null;
  vatPct?: number | null;
  vatBase?: VatBase | null;
}

/** Resolution chain: product -> seller -> category -> platform default. */
const RESOLUTION_ORDER: FeeSourceOrder[] = ['product', 'seller', 'category', 'default'];
type FeeSourceOrder = 'product' | 'seller' | 'category' | 'default';

@Injectable()
export class FeeService {
  constructor(
    @InjectRepository(FeeConfig)
    private readonly repo: Repository<FeeConfig>,
    @InjectRepository(FeeOverride)
    private readonly overrideRepo: Repository<FeeOverride>,
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
    if (dto.vatBase !== undefined) config.vatBase = dto.vatBase;
    if (dto.sellerCommissionPct !== undefined) config.sellerCommissionPct = dto.sellerCommissionPct;
    if (dto.buyerFeeEnabled !== undefined) config.buyerFeeEnabled = dto.buyerFeeEnabled;
    if (dto.sellerFeeEnabled !== undefined) config.sellerFeeEnabled = dto.sellerFeeEnabled;
    if (dto.otherChargesPct !== undefined) config.otherChargesPct = dto.otherChargesPct;
    if (dto.fixedFee !== undefined) config.fixedFee = dto.fixedFee;
    if (dto.isActive !== undefined) config.isActive = dto.isActive;

    return this.repo.save(config);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  // --- U5: per-seller / per-product overrides -------------------------

  async listOverrides(scope?: FeeOverrideScope): Promise<FeeOverride[]> {
    const where = scope ? { scope } : {};
    return this.overrideRepo.find({ where, order: { updatedAt: 'DESC' } });
  }

  async getOverride(scope: FeeOverrideScope, scopeId: string): Promise<FeeOverride | null> {
    return this.overrideRepo.findOne({ where: { scope, scopeId } });
  }

  /** Create or update a scope's override. Null values are stored as NULL (inherit). */
  async upsertOverride(dto: UpsertFeeOverrideDto): Promise<FeeOverride> {
    let row = await this.getOverride(dto.scope, dto.scopeId);
    if (!row) {
      row = this.overrideRepo.create({ scope: dto.scope, scopeId: dto.scopeId });
    }
    if (dto.buyerFeePct !== undefined) row.buyerFeePct = dto.buyerFeePct;
    if (dto.buyerFeeEnabled !== undefined) row.buyerFeeEnabled = dto.buyerFeeEnabled;
    if (dto.sellerFeePct !== undefined) row.sellerFeePct = dto.sellerFeePct;
    if (dto.sellerFeeEnabled !== undefined) row.sellerFeeEnabled = dto.sellerFeeEnabled;
    if (dto.vatPct !== undefined) row.vatPct = dto.vatPct;
    if (dto.vatBase !== undefined) row.vatBase = dto.vatBase;
    return this.overrideRepo.save(row);
  }

  async removeOverride(scope: FeeOverrideScope, scopeId: string): Promise<void> {
    await this.overrideRepo.delete({ scope, scopeId });
  }

  /**
   * Resolve the effective fee config through the U5 chain:
   * product override -> seller override -> category config -> platform default.
   * The first layer that has ANY non-null fee value contributes it; remaining
   * fields keep falling through to later layers.
   */
  async resolveEffectiveConfig(input: {
    category?: string | null;
    sellerId?: string | null;
    productId?: string | null;
  }): Promise<EffectiveFeeConfig> {
    const def = await this.findByCategory('default');
    const cat =
      input.category && input.category !== 'default'
        ? await this.repo.findOne({ where: { category: input.category } })
        : null;

    const productOv = input.productId
      ? await this.getOverride(FeeOverrideScope.PRODUCT, input.productId)
      : null;
    const sellerOv = input.sellerId
      ? await this.getOverride(FeeOverrideScope.SELLER, input.sellerId)
      : null;

    const layers: Array<{ source: FeeSourceOrder; ov: FeeOverride | null; cfg: FeeConfig | null }> = [
      { source: 'product', ov: productOv, cfg: null },
      { source: 'seller', ov: sellerOv, cfg: null },
      { source: 'category', ov: null, cfg: cat },
      { source: 'default', ov: null, cfg: def },
    ];

    const eff: EffectiveFeeConfig = {
      buyerFeePct: Number(def.commissionPct),
      buyerFeeEnabled: def.buyerFeeEnabled,
      sellerFeePct: Number(def.sellerCommissionPct),
      sellerFeeEnabled: def.sellerFeeEnabled,
      vatPct: Number(def.vatPct),
      vatBase: def.vatBase,
      otherChargesPct: Number(def.otherChargesPct),
      fixedFee: Number(def.fixedFee),
      source: 'default',
    };

    for (const layer of layers) {
      if (layer.source === 'default') break; // already seeded
      if (layer.source === 'category' && !layer.cfg) continue;
      const hasAny = layer.ov
        ? layer.ov.buyerFeePct != null ||
          layer.ov.buyerFeeEnabled != null ||
          layer.ov.sellerFeePct != null ||
          layer.ov.sellerFeeEnabled != null ||
          layer.ov.vatPct != null ||
          layer.ov.vatBase != null
        : false;
      if (layer.ov && !hasAny) continue;
      if (!layer.ov && !layer.cfg) continue;

      eff.source = layer.source;

      if (layer.ov) {
        if (layer.ov.buyerFeePct != null) eff.buyerFeePct = Number(layer.ov.buyerFeePct);
        if (layer.ov.buyerFeeEnabled != null) eff.buyerFeeEnabled = layer.ov.buyerFeeEnabled;
        if (layer.ov.sellerFeePct != null) eff.sellerFeePct = Number(layer.ov.sellerFeePct);
        if (layer.ov.sellerFeeEnabled != null) eff.sellerFeeEnabled = layer.ov.sellerFeeEnabled;
        if (layer.ov.vatPct != null) eff.vatPct = Number(layer.ov.vatPct);
        if (layer.ov.vatBase != null) eff.vatBase = layer.ov.vatBase;
      } else if (layer.cfg) {
        eff.buyerFeePct = Number(layer.cfg.commissionPct);
        eff.buyerFeeEnabled = layer.cfg.buyerFeeEnabled;
        eff.sellerFeePct = Number(layer.cfg.sellerCommissionPct);
        eff.sellerFeeEnabled = layer.cfg.sellerFeeEnabled;
        eff.vatPct = Number(layer.cfg.vatPct);
        eff.vatBase = layer.cfg.vatBase;
        eff.otherChargesPct = Number(layer.cfg.otherChargesPct);
        eff.fixedFee = Number(layer.cfg.fixedFee);
      }
    }

    return eff;
  }

  /**
   * Override-aware breakdown for a lot. Used by settlement and the direct-sale
   * invoice path. Optionally accepts a pre-resolved config (avoids re-querying
   * inside an open transaction).
   */
  async resolveAndCompute(
    amount: number,
    input: { category?: string | null; sellerId?: string | null; productId?: string | null },
    preResolved?: EffectiveFeeConfig,
  ): Promise<FeeBreakdown> {
    const cfg = preResolved ?? (await this.resolveEffectiveConfig(input));
    return computeFeeBreakdown(amount, cfg);
  }

  async getBreakdown(amount: number, category?: string): Promise<any> {
    const eff = await this.resolveEffectiveConfig({ category: category || 'default' });
    const breakdown = computeFeeBreakdown(amount, eff);
    return {
      ...breakdown,
      rates: {
        commissionPct: eff.buyerFeePct,
        buyerFeePct: eff.buyerFeePct,
        sellerFeePct: eff.sellerFeePct,
        vatPct: eff.vatPct,
        vatBase: eff.vatBase,
        otherChargesPct: eff.otherChargesPct,
        fixedFee: eff.fixedFee,
        buyerFeeEnabled: eff.buyerFeeEnabled,
        sellerFeeEnabled: eff.sellerFeeEnabled,
        source: eff.source,
      },
    };
  }

  /**
   * Seed default configuration on module init. Idempotent; upgrades existing
   * rows in place with the U5 columns when they are missing.
   */
  async seedDefaults(): Promise<void> {
    const existing = await this.repo.findOne({ where: { category: 'default' } });
    if (!existing) {
      await this.repo.save(
        this.repo.create({
          category: 'default',
          displayName: 'Platform Default',
          commissionPct: 5,
          vatPct: 7.5,
          vatBase: VatBase.HAMMER_AND_FEES,
          sellerCommissionPct: 5,
          buyerFeeEnabled: true,
          sellerFeeEnabled: true,
          otherChargesPct: 0,
          fixedFee: 0,
        }),
      );
    } else if (existing.vatBase == null || existing.sellerCommissionPct == null) {
      // U5 upgrade: keep the stored commission as the buyer fee, seed the new
      // seller commission at 5% and default the VAT base to hammer+fees.
      existing.sellerCommissionPct ??= 5;
      existing.vatBase ??= VatBase.HAMMER_AND_FEES;
      existing.buyerFeeEnabled ??= true;
      existing.sellerFeeEnabled ??= true;
      await this.repo.save(existing);
    }
  }
}