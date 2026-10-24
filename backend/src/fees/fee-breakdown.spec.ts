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

  // ── Accounting invariants (the buyer bill and the seller receipt must reconcile) ──

  it('splits every naira of the buyer bill between seller, platform and VAT', () => {
    const b = computeFeeBreakdown(100000, {
      ...base,
      otherChargesPct: 2,
      fixedFee: 500,
    });
    // Nothing is created or lost: the three recipients sum to what is charged.
    expect(b.sellerNet + b.platformShare + b.vatTotal).toBeCloseTo(b.total, 2);
  });

  it('seller receives hammer minus the seller fee, never the buyer premium', () => {
    const b = computeFeeBreakdown(100000, base);
    expect(b.sellerNet).toBe(95000); // 100000 - 5%
    // The buyer pays more than the seller receives; the difference is not the seller's.
    expect(b.total).toBeGreaterThan(b.sellerNet);
    expect(b.platformShare + b.vatTotal).toBeCloseTo(b.total - b.sellerNet, 2);
  });

  it('counts otherCharges as platform revenue, not as VAT or seller proceeds', () => {
    const b = computeFeeBreakdown(10000, { ...base, otherChargesPct: 3, fixedFee: 0 });
    expect(b.otherCharges).toBe(300);
    expect(b.platformShare).toBeCloseTo(b.buyerFee + b.sellerFee + 300, 2);
  });

  it('rounds each line once so the printed components sum to the total', () => {
    // 100.15 * 5% = 5.0075 -> 5.01 ; VAT on that = 0.37575 -> 0.38
    const b = computeFeeBreakdown(100.15, base);
    const sum =
      b.bidAmount + b.buyerFee + b.vatOnBid + b.vatOnBuyerFee + b.otherCharges + b.fixedFee;
    expect(Math.round(sum * 100) / 100).toBe(b.total);
    expect(b.buyerFee).toBe(5.01);
  });

  it('every money field is a number, never a decimal string', () => {
    const b = computeFeeBreakdown('1000.00' as unknown as number, base);
    const moneyFields = [
      'bidAmount', 'buyerFee', 'sellerFee', 'vatOnBid', 'vatOnBuyerFee',
      'otherCharges', 'fixedFee', 'total', 'sellerNet', 'platformShare', 'vatTotal',
    ] as const;
    for (const key of moneyFields) {
      expect(typeof b[key]).toBe('number');
      expect(Number.isFinite(b[key])).toBe(true);
    }
  });

  it('produced amounts have at most 2 decimal places', () => {
    const b = computeFeeBreakdown(3333.33, { ...base, vatPct: 7.5, otherChargesPct: 1.5 });
    for (const key of ['buyerFee', 'sellerFee', 'vatOnBid', 'vatOnBuyerFee', 'otherCharges', 'total', 'sellerNet', 'platformShare', 'vatTotal'] as const) {
      expect(Math.round(b[key] * 100)).toBeCloseTo(b[key] * 100, 6);
    }
  });
});