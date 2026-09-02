import {
  VatBase,
  computeFeeBreakdown,
  EffectiveFeeConfig,
} from './fee-breakdown';

const base: EffectiveFeeConfig = {
  buyerFeePct: 5,
  buyerFeeEnabled: true,
  sellerFeePct: 5,
  sellerFeeEnabled: true,
  vatPct: 7.5,
  vatBase: VatBase.HAMMER_AND_FEES,
  otherChargesPct: 0,
  fixedFee: 0,
  source: 'default',
};

describe('computeFeeBreakdown (U5 fee model)', () => {
  it('applies 5% buyer fee + 5% seller fee with hammer+fees VAT (U5 #1/#2)', () => {
    const b = computeFeeBreakdown(10000, base);
    // buyer fee = 500; VAT = 7.5% of (hammer + buyer fee) = 787.50
    expect(b.buyerFee).toBe(500);
    expect(b.sellerFee).toBe(500);
    expect(b.vatOnBid).toBe(750);
    expect(b.vatOnBuyerFee).toBe(37.5);
    expect(b.total).toBeCloseTo(10000 + 500 + 750 + 37.5, 2);
    expect(b.sellerNet).toBe(9500);
  });

  it('applies VAT to fees only when vatBase is fees_only (U5 #2)', () => {
    const b = computeFeeBreakdown(10000, { ...base, vatBase: VatBase.FEES_ONLY });
    expect(b.vatOnBid).toBe(0);
    expect(b.vatOnBuyerFee).toBe(37.5);
    expect(b.total).toBeCloseTo(10000 + 500 + 37.5, 2);
  });

  it('drops the buyer fee when the toggle is off (U5 #1)', () => {
    const b = computeFeeBreakdown(10000, { ...base, buyerFeeEnabled: false });
    expect(b.buyerFee).toBe(0);
    expect(b.vatOnBuyerFee).toBe(0);
    expect(b.total).toBeCloseTo(10000 + 750, 2);
  });

  it('drops the seller fee when the toggle is off (U5 #1)', () => {
    const b = computeFeeBreakdown(10000, { ...base, sellerFeeEnabled: false });
    expect(b.sellerFee).toBe(0);
    expect(b.sellerNet).toBe(10000);
  });

  it('includes other charges and fixed fee in the buyer total', () => {
    const b = computeFeeBreakdown(10000, {
      ...base,
      otherChargesPct: 1,
      fixedFee: 250,
    });
    expect(b.otherCharges).toBe(100);
    expect(b.fixedFee).toBe(250);
    expect(b.total).toBeCloseTo(10000 + 500 + 750 + 37.5 + 100 + 250, 2);
  });

  it('handles zero hammer price', () => {
    const b = computeFeeBreakdown(0, base);
    expect(b.total).toBe(0);
    expect(b.sellerNet).toBe(0);
  });
});