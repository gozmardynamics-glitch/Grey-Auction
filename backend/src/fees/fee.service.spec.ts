import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FeeConfig } from './fee-config.entity';
import { FeeOverride, FeeOverrideScope } from './fee-override.entity';
import { FeeService } from './fee.service';
import { VatBase } from './fee-breakdown';

const defaultConfig = {
  category: 'default',
  commissionPct: '5.00',
  vatPct: '7.50',
  vatBase: VatBase.HAMMER_AND_FEES,
  sellerCommissionPct: '5.00',
  buyerFeeEnabled: true,
  sellerFeeEnabled: true,
  otherChargesPct: '0.00',
  fixedFee: '0.00',
} as any;

describe('FeeService (U5 resolution chain)', () => {
  let service: FeeService;
  const configRepo = { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn() };
  const overrideRepo = { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn(), delete: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    configRepo.findOne.mockImplementation(async ({ where }: any) =>
      where.category === 'default' ? defaultConfig : null,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeeService,
        { provide: getRepositoryToken(FeeConfig), useValue: configRepo },
        { provide: getRepositoryToken(FeeOverride), useValue: overrideRepo },
      ],
    }).compile();
    service = module.get<FeeService>(FeeService);
  });

  it('falls back to the platform default when nothing overrides', async () => {
    const eff = await service.resolveEffectiveConfig({ category: 'art', sellerId: 's1', productId: 'p1' });
    expect(eff.buyerFeePct).toBe(5);
    expect(eff.sellerFeePct).toBe(5);
    expect(eff.source).toBe('default');
  });

  it('a category config overrides the default', async () => {
    configRepo.findOne.mockImplementation(async ({ where }: any) =>
      where.category === 'art'
        ? { ...defaultConfig, category: 'art', commissionPct: '8.00' }
        : defaultConfig,
    );
    const eff = await service.resolveEffectiveConfig({ category: 'art' });
    expect(eff.buyerFeePct).toBe(8);
    expect(eff.source).toBe('category');
  });

  it('a seller override beats the category and default (U5 #1)', async () => {
    overrideRepo.findOne.mockImplementation(async ({ where }: any) =>
      where.scope === FeeOverrideScope.SELLER
        ? { scope: 'seller', scopeId: 's1', buyerFeePct: '5.00', buyerFeeEnabled: false, sellerFeePct: null, sellerFeeEnabled: null, vatPct: null, vatBase: null }
        : null,
    );
    const eff = await service.resolveEffectiveConfig({ category: 'art', sellerId: 's1' });
    expect(eff.buyerFeeEnabled).toBe(false);
    expect(eff.buyerFeePct).toBe(5);
    expect(eff.source).toBe('seller');
  });

  it('a buyer override beats seller/category/default but not product (U5 #1, buyer scope)', async () => {
    overrideRepo.findOne.mockImplementation(async ({ where }: any) =>
      where.scope === FeeOverrideScope.BUYER
        ? { scope: 'buyer', scopeId: 'b1', buyerFeePct: '3.00', buyerFeeEnabled: true, sellerFeePct: null, sellerFeeEnabled: null, vatPct: null, vatBase: null }
        : null,
    );
    // No product/seller overrides; buyer fee comes from the buyer layer
    const eff = await service.resolveEffectiveConfig({ category: 'art', sellerId: 's1', buyerId: 'b1' });
    expect(eff.buyerFeePct).toBe(3);
    expect(eff.buyerFeeEnabled).toBe(true);
    expect(eff.source).toBe('buyer');

    // Product override still wins over the buyer layer
    overrideRepo.findOne.mockImplementation(async ({ where }: any) =>
      where.scope === FeeOverrideScope.PRODUCT
        ? { scope: 'product', scopeId: 'p1', buyerFeePct: '1.00', buyerFeeEnabled: null, sellerFeePct: null, sellerFeeEnabled: null, vatPct: null, vatBase: null }
        : where.scope === FeeOverrideScope.BUYER
          ? { scope: 'buyer', scopeId: 'b1', buyerFeePct: '3.00', buyerFeeEnabled: null, sellerFeePct: null, sellerFeeEnabled: null, vatPct: null, vatBase: null }
          : null,
    );
    const eff2 = await service.resolveEffectiveConfig({ sellerId: 's1', productId: 'p1', buyerId: 'b1' });
    expect(eff2.buyerFeePct).toBe(1);
    expect(eff2.source).toBe('product');
  });

  it('a product override beats everything (U5 #1)', async () => {
    overrideRepo.findOne.mockImplementation(async ({ where }: any) =>
      where.scope === FeeOverrideScope.PRODUCT
        ? { scope: 'product', scopeId: 'p1', buyerFeePct: '0.00', buyerFeeEnabled: false, sellerFeePct: '2.50', sellerFeeEnabled: true, vatPct: null, vatBase: VatBase.FEES_ONLY }
        : null,
    );
    const eff = await service.resolveEffectiveConfig({ category: 'art', sellerId: 's1', productId: 'p1' });
    expect(eff.buyerFeePct).toBe(0);
    expect(eff.buyerFeeEnabled).toBe(false);
    expect(eff.sellerFeePct).toBe(2.5);
    expect(eff.vatBase).toBe(VatBase.FEES_ONLY);
    expect(eff.source).toBe('product');
  });

  it('partial product override inherits the rest from deeper layers', async () => {
    // product sets only vatBase; seller sets only buyerFeePct
    overrideRepo.findOne
      .mockImplementation(async ({ where }: any) =>
        where.scope === FeeOverrideScope.PRODUCT
          ? { scope: 'product', scopeId: 'p1', buyerFeePct: null, buyerFeeEnabled: null, sellerFeePct: null, sellerFeeEnabled: null, vatPct: null, vatBase: VatBase.FEES_ONLY }
          : null,
      );
    const eff = await service.resolveEffectiveConfig({ sellerId: 's1', productId: 'p1' });
    // seller layer has nothing (null) so source is the product layer...
    // but only vatBase came from it; buyerFeePct stays at the default
    expect(eff.vatBase).toBe(VatBase.FEES_ONLY);
    expect(eff.buyerFeePct).toBe(5);
  });

  it('upsertOverride creates then updates the same row', async () => {
    overrideRepo.findOne.mockResolvedValue(null);
    overrideRepo.create.mockImplementation((x: any) => x);
    overrideRepo.save.mockImplementation(async (x: any) => ({ id: 'ov1', ...x }));

    await service.upsertOverride({
      scope: FeeOverrideScope.SELLER,
      scopeId: 's1',
      buyerFeePct: 5,
      sellerFeePct: 5,
    });
    expect(overrideRepo.save).toHaveBeenCalledTimes(1);

    overrideRepo.findOne.mockResolvedValue({ id: 'ov1', scope: 'seller', scopeId: 's1', buyerFeePct: null, buyerFeeEnabled: null, sellerFeePct: null, sellerFeeEnabled: null, vatPct: null, vatBase: null });
    await service.upsertOverride({
      scope: FeeOverrideScope.SELLER,
      scopeId: 's1',
      buyerFeeEnabled: false,
    });
    expect(overrideRepo.save).toHaveBeenCalledTimes(2);
  });
});