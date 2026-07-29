import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { LLMModel } from './llm-model.entity';

export enum FeatureQuality {
  PREMIUM = 'premium',
  STANDARD = 'standard',
  DRAFT = 'draft',
}

@Entity('ai_feature_configs')
export class AIFeatureConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  featureKey: string;

  @Column()
  section: string;

  @Column()
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  isEnabled: boolean;

  @Column({ type: 'enum', enum: FeatureQuality, default: FeatureQuality.STANDARD })
  quality: FeatureQuality;

  @Column({ type: 'text', nullable: true })
  systemPrompt: string;

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 0.7 })
  temperature: number;

  @Column({ type: 'int', default: 2048 })
  maxTokens: number;

  @Column({ type: 'int', default: 10 })
  rateLimitPerMinute: number;

  @Column({ type: 'int', default: 1000 })
  rateLimitPerDay: number;

  @ManyToOne(() => LLMModel, { nullable: true, onDelete: 'SET NULL' })
  primaryModel: LLMModel;

  @Column({ nullable: true })
  primaryModelId: string;

  @ManyToOne(() => LLMModel, { nullable: true, onDelete: 'SET NULL' })
  fallbackModel: LLMModel;

  @Column({ nullable: true })
  fallbackModelId: string;

  @ManyToOne(() => LLMModel, { nullable: true, onDelete: 'SET NULL' })
  tertiaryModel: LLMModel;

  @Column({ nullable: true })
  tertiaryModelId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
