import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum SubscriptionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  UNSUBSCRIBED = 'unsubscribed',
}

@Entity('email_subscriptions')
@Index(['email'], { unique: true })
export class EmailSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', length: 64 })
  token: string;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.PENDING })
  status: SubscriptionStatus;

  @CreateDateColumn()
  createdAt: Date;
}
