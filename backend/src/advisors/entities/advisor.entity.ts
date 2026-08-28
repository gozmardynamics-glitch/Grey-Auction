import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum AdvisorType {
  ADVISOR = 'advisor',
  DEALER = 'dealer',
  BRANCH = 'branch',
}

/**
 * Marketplace advisor (L8): a local expert/dealer/branch a buyer can visit.
 * Latitude/longitude power the "find an advisor near you" map/directory.
 */
@Entity('advisors')
@Index(['country', 'region'])
@Index(['type'])
export class Advisor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'enum', enum: AdvisorType, default: AdvisorType.ADVISOR })
  type: AdvisorType;

  @Column({ type: 'varchar', length: 120, nullable: true })
  specialty: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 120 })
  city: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  region: string;

  @Column({ type: 'varchar', length: 100, default: 'Nigeria' })
  country: string;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  email: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
