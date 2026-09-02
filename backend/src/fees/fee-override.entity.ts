import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { VatBase } from './fee-breakdown';

export enum FeeOverrideScope {
  SELLER = 'seller',
  PRODUCT = 'product',
}

/**
 * U5 answer #1 — per-seller AND per-product fee overrides.
 *
 * A row scoped 'seller' carries scopeId = the seller's user id (matches
 * products.sellerId). A row scoped 'product' carries scopeId = product id.
 * Every fee field is nullable: null = inherit from the next layer of the
 * resolution chain (product → seller → category → platform default).
 */
@Entity('fee_overrides')
@Index(['scope', 'scopeId'], { unique: true })
export class FeeOverride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: FeeOverrideScope, enumName: 'fee_override_scope' })
  scope: FeeOverrideScope;

  @Column({ type: 'uuid' })
  scopeId: string;

  // Buyer fee 5% (buyer premium) — adjustable + toggleable per scope.
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  buyerFeePct: number | null;

  @Column({ type: 'boolean', nullable: true })
  buyerFeeEnabled: boolean | null;

  // Seller commission 5% — adjustable + toggleable per scope.
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  sellerFeePct: number | null;

  @Column({ type: 'boolean', nullable: true })
  sellerFeeEnabled: boolean | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  vatPct: number | null;

  // U5 answer #2 — VAT base switch (fees-only vs hammer+fees).
  @Column({ type: 'enum', enum: VatBase, enumName: 'fee_vat_base', nullable: true })
  vatBase: VatBase | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
