import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum InviteExpiry {
  ONE_HOUR = '1h',
  TWENTY_FOUR_HOURS = '24h',
  SEVEN_DAYS = '7d',
  NEVER = 'never',
}

@Entity('invites')
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column()
  roomId: string;

  @Column()
  token: string;

  @Column()
  createdBy: string;

  @Column({ type: 'enum', enum: InviteExpiry, default: InviteExpiry.TWENTY_FOUR_HOURS })
  expiry: InviteExpiry;

  @Column()
  expiresAt: Date;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ default: 10 })
  maxUsage: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  isExpired(): boolean {
    return new Date() > this.expiresAt || this.usageCount >= this.maxUsage || !this.isActive;
  }
}
