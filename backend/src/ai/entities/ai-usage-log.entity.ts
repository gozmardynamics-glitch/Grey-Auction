import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('ai_usage_logs')
@Index(['createdAt'])
@Index(['featureKey', 'createdAt'])
@Index(['providerName'])
export class AIUsageLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  featureKey: string;

  @Column({ nullable: true })
  modelId: string;

  @Column({ nullable: true })
  providerName: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ type: 'int', default: 0 })
  promptTokens: number;

  @Column({ type: 'int', default: 0 })
  completionTokens: number;

  @Column({ type: 'decimal', precision: 12, scale: 6, default: 0 })
  estimatedCost: number;

  @Column({ type: 'int', default: 0 })
  latencyMs: number;

  @Column({ default: true })
  success: boolean;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ type: 'int', nullable: true })
  attemptNumber: number;

  @CreateDateColumn()
  createdAt: Date;
}
