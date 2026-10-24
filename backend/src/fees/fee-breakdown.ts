/**
 * U5 fee model — pure breakdown math (no DB, fully unit-testable).
 *
 * Two money sides:
 *  - Buyer side: hammer + buyer fee (premium) + VAT on the buyer base + fixed fee.
 *  - Seller side: hammer − seller commission (platform cut from the seller's proceeds).
 *
 * VAT base switch (U5 answer #2):
 *  - 'hammer_and_fees' → VAT applies to hammer + buyer fee (legacy behaviour).
 *  - 'fees_only'       → VAT applies to the buyer fee only.
 */
export enum VatBase {
  FEES_ONLY = 'fees_only',
  HAMMER_AND_FEES = 'hammer_and_fees',
}

export type FeeSource = 'default' | 'category' | 'buyer' | 'seller' | 'product';

/** Effective (resolved) fee configuration after the product → seller → category → default chain. */
export interface EffectiveFeeConfig {
  buyerFeePct: number;
  buyerFeeEnabled: boolean;
  sellerFeePct: number;
  sellerFeeEnabled: boolean;
  vatPct: number;
  vatBase: VatBase;
  otherChargesPct: number;
  fixedFee: number;
  /** Outermost layer that actually contributed a value. */
  source: FeeSource;
}

export interface FeeBreakdown {
  bidAmount: number;
  /** Buyer-side premium (legacy `commission`). */
  buyerFee: number;
  /** Platform cut from the seller's proceeds (not charged to the buyer). */
  sellerFee: number;
  vatOnBid: number;
  vatOnBuyerFee: number;
  otherCharges: number;
  fixedFee: number;
  /** Buyer pays: hammer + buyer fee + VAT + other charges + fixed fee. */
  total: number;
  /** Seller receives: hammer − seller fee. */
  sellerNet: number;
  /** Everything the platform keeps: buyer fee + seller fee + other charges + fixed fee. */
  platformShare: number;
  /** VAT collected, which belongs to neither party. */
  vatTotal: number;
  vatBase: VatBase;
  source: FeeSource;
}

/** Rounds to 2dp, matching every money column. Avoids float drift like 5.0075 → 5.01. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Single source of truth for what a lot costs and what each side receives.
 *
 * Every component is rounded to 2dp **once**, and `total`/`sellerNet` are derived
 * from those rounded values rather than from raw floats. Otherwise the printed
 * line items can sum to a cent more than the total that is actually charged,
 * which makes invoice reconciliation drift forever.
 *
 *   Buyer pays:    bid + buyerFee + vatOnBid + vatOnBuyerFee + otherCharges + fixedFee
 *   Seller gets:   bid − sellerFee
 *   Platform keeps: buyerFee + sellerFee + otherCharges + fixedFee
 *   VAT:           vatOnBid + vatOnBuyerFee (remitted, paid to neither party)
 */
export function computeFeeBreakdown(amount: number, cfg: EffectiveFeeConfig): FeeBreakdown {
  const hammer = round2(Number(amount) || 0);

  const buyerFee = cfg.buyerFeeEnabled
    ? round2((hammer * Number(cfg.buyerFeePct || 0)) / 100)
    : 0;
  const sellerFee = cfg.sellerFeeEnabled
    ? round2((hammer * Number(cfg.sellerFeePct || 0)) / 100)
    : 0;

  const vatPct = Number(cfg.vatPct || 0);
  const vatOnBid =
    cfg.vatBase === VatBase.HAMMER_AND_FEES ? round2((hammer * vatPct) / 100) : 0;
  const vatOnBuyerFee = round2((buyerFee * vatPct) / 100);

  const otherCharges = round2((hammer * Number(cfg.otherChargesPct || 0)) / 100);
  const fixedFee = round2(Number(cfg.fixedFee || 0));

  const total = round2(
    hammer + buyerFee + vatOnBid + vatOnBuyerFee + otherCharges + fixedFee,
  );

  return {
    bidAmount: hammer,
    buyerFee,
    sellerFee,
    vatOnBid,
    vatOnBuyerFee,
    otherCharges,
    fixedFee,
    total,
    sellerNet: round2(hammer - sellerFee),
    platformShare: round2(buyerFee + sellerFee + otherCharges + fixedFee),
    vatTotal: round2(vatOnBid + vatOnBuyerFee),
    vatBase: cfg.vatBase,
    source: cfg.source,
  };
}
