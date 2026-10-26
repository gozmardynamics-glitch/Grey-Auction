import { decimalTransformer, roundMoney, toMoney } from './decimal.transformer';

describe('decimalTransformer', () => {
  it('converts a numeric string to a number on write', () => {
    expect(decimalTransformer.to('1000.00')).toBe(1000);
    expect(decimalTransformer.to('0.5')).toBe(0.5);
  });

  it('keeps zero as zero (never treats it as absent)', () => {
    expect(decimalTransformer.to(0)).toBe(0);
    expect(decimalTransformer.to('0.00')).toBe(0);
  });

  it('passes undefined through so the column DEFAULT applies', () => {
    // Regression: returning null here wrote an explicit NULL and broke every
    // insert that omitted a money column with a default (POST /products on
    // currentBid, wallet creation on balance).
    expect(decimalTransformer.to(undefined)).toBeUndefined();
    expect(decimalTransformer.to('')).toBeUndefined();
  });

  it('preserves an explicit null for nullable columns', () => {
    expect(decimalTransformer.to(null)).toBeNull();
  });

  it('maps a non-numeric value to null rather than NaN', () => {
    expect(decimalTransformer.to('not-a-number')).toBeNull();
  });

  it('reads numeric strings back as numbers', () => {
    expect(decimalTransformer.from('2500000.00')).toBe(2500000);
    expect(decimalTransformer.from(null)).toBeNull();
  });
});

describe('money helpers', () => {
  it('toMoney coerces junk to 0', () => {
    expect(toMoney('1000.00')).toBe(1000);
    expect(toMoney(undefined)).toBe(0);
    expect(toMoney('abc')).toBe(0);
  });

  it('roundMoney rounds to 2dp without float drift', () => {
    expect(roundMoney(5.0075)).toBe(5.01);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });
});
