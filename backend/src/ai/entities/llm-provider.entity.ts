import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { LLMModel } from './llm-model.entity';

export enum ProviderTier {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
  TESTING = 'testing',
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

  @OneToMany(() => LLMModel, (model) => model.provider, { cascade: true })
  models: LLMModel[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
