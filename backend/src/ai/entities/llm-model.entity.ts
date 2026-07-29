import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { LLMProvider } from './llm-provider.entity';

@Entity('llm_models')
export class LLMModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  modelId: string;

  @Column()
  displayName: string;

  @Column('simple-array', { nullable: true })
  capabilities: string[];

  @Column({ type: 'int', default: 4096 })
  contextWindow: number;

  @Column({ type: 'int', default: 2048 })
  maxOutputTokens: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  inputPricePerMillion: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  outputPricePerMillion: number;

  @Column({ type: 'decimal', precision: 6, scale: 3, default: 0.7 })
  defaultTemperature: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => LLMProvider, (provider) => provider.models, { onDelete: 'CASCADE' })
  provider: LLMProvider;

  @Column()
  providerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
