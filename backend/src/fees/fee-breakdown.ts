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
  vatBase: VatBase;
  source: FeeSource;
}

export function computeFeeBreakdown(amount: number, cfg: EffectiveFeeConfig): FeeBreakdown {
  const hammer = Number(amount) || 0;
  const buyerFee = cfg.buyerFeeEnabled ? (hammer * Number(cfg.buyerFeePct || 0)) / 100 : 0;
  const sellerFee = cfg.sellerFeeEnabled ? (hammer * Number(cfg.sellerFeePct || 0)) / 100 : 0;
  const vatPct = Number(cfg.vatPct || 0);

  const vatOnBid = cfg.vatBase === VatBase.HAMMER_AND_FEES ? (hammer * vatPct) / 100 : 0;
  const vatOnBuyerFee = (buyerFee * vatPct) / 100;

  const otherCharges = (hammer * Number(cfg.otherChargesPct || 0)) / 100;
  const fixedFee = Number(cfg.fixedFee || 0);

  const total = hammer + buyerFee + vatOnBid + vatOnBuyerFee + otherCharges + fixedFee;

  return {
    bidAmount: hammer,
    buyerFee,
    sellerFee,
    vatOnBid,
    vatOnBuyerFee,
    otherCharges,
    fixedFee,
    total,
    sellerNet: hammer - sellerFee,
    vatBase: cfg.vatBase,
    source: cfg.source,
  };
}
