import { ValueTransformer } from 'typeorm';

/**
 * Postgres `numeric`/`decimal` is returned by the `pg` driver as a **string**,
 * because the value can exceed IEEE-754 precision. Without a transformer that
 * string leaks into business logic, and `Number(a) + b` then *concatenates*:
 *
 *   Number('1000.00') + '50000.00'  ->  '100050000.00'
 *
 * which is how a wallet balance can be inflated 100x (or, with a cents balance,
 * become an invalid numeric literal and abort the transaction).
 *
 * TypeORM applies `to` on write and `from` on read, so arithmetic always sees a
 * number. Precision is bounded by decimal(18,2) in the database, so converting to
 * a JS number is safe for the amounts this platform handles.
 */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | string | null): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  from: (value?: string | number | null): number | null => {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
};

/**
 * Coerces anything decimal-ish to a finite number, defaulting to 0.
 * Use at the boundary when a value might still be a string (raw query results,
 * DTO input, or columns that predate the transformer).
 */
export function toMoney(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Rounds to 2dp, the precision of every money column here. */
export function roundMoney(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
