import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { LLMModel } from './llm-model.entity';

export enum ProviderTier {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
  TESTING = 'testing',
}

export enum ProviderStatus {
  UNKNOWN = 'unknown',
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  DOWN = 'down',
}

/** Wire protocol family — determines auth style + request format. */
export enum ProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GEMINI = 'gemini',
}

@Entity('llm_providers')
export class LLMProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  displayName: string;

  @Column()
  baseUrl: string;

  @Column()
  apiKey: string;

  @Column({ type: 'jsonb', nullable: true })
  headers: Record<string, string>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: ProviderTier, default: ProviderTier.PRODUCTION })
  tier: ProviderTier;

  @Column({ type: 'enum', enum: ProviderType, default: ProviderType.OPENAI })
  providerType: ProviderType;

  @Column({ type: 'enum', enum: ProviderStatus, default: ProviderStatus.UNKNOWN })
  status: ProviderStatus;

  @Column({ type: 'timestamptz', nullable: true })
  lastCheckedAt: Date;

  @Column({ type: 'int', nullable: true })
  lastLatencyMs: number;

  @Column({ type: 'int', default: 0 })
  consecutiveFailures: number;

  @OneToMany(() => LLMModel, (model) => model.provider, { cascade: true })
  models: LLMModel[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
