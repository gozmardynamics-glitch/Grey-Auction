import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AgentTool } from './agent-tool.entity';

export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEGRADED = 'degraded',
  LEARNING = 'learning',
  ERROR = 'error',
}

export enum AgentCategory {
  MARKETING = 'marketing',
  SECURITY = 'security',
  SALES = 'sales',
  SUPPORT = 'support',
  CRM = 'crm',
  OPERATIONS = 'operations',
  CUSTOM = 'custom',
}

@Entity('agent_instances')
export class AgentInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  displayName: string;

  @Column({ type: 'enum', enum: AgentCategory, default: AgentCategory.CUSTOM })
  category: AgentCategory;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  systemPrompt: string;

  @Column({ default: 'gpt-4o-mini' })
  modelId: string;

  @Column({ default: 'openai' })
  providerName: string;

  @Column({ default: 0.7, type: 'decimal', precision: 4, scale: 2 })
  temperature: number;

  @Column({ default: 2048 })
  maxTokens: number;

  @Column({ type: 'simple-array', nullable: true })
  toolIds: string[];

  @Column({ type: 'simple-array', nullable: true })
  triggerEvents: string[];

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ type: 'enum', enum: AgentStatus, default: AgentStatus.INACTIVE })
  status: AgentStatus;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  mcpEndpoint: string;

  @Column({ default: 60000 })
  timeoutMs: number;

  @Column({ default: 3 })
  maxRetries: number;

  @Column({ type: 'bigint', default: 0 })
  totalExecutions: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  successRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  avgLatencyMs: number;

  @Column({ nullable: true })
  lastRunAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
