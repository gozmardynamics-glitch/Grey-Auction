import { Exclude } from 'class-transformer';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  BIDDER = 'bidder',
  SELLER = 'seller',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.BIDDER,
  })
  role: UserRole;

  @Column()
  name: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  /** Legacy external auth link (nullable, unused — kept for migration compatibility). */
  @Column({ nullable: true })
  clerkId: string;

  // OTP email-verification state (persisted so verifyOtp can match).
  // @Exclude: these must never appear in any API response.
  @Column({ type: 'varchar', length: 6, nullable: true })
  @Exclude({ toPlainOnly: true })
  otpCode: string;

  @Column({ type: 'timestamp', nullable: true })
  @Exclude({ toPlainOnly: true })
  otpExpiry: Date;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
