import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum WorkflowTrigger {
  MANUAL = 'manual',
  EVENT = 'event',
  CRON = 'cron',
  API = 'api',
}

export enum WorkflowStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  RUNNING = 'running',
  FAILED = 'failed',
}

@Entity('agent_workflows')
export class AgentWorkflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: WorkflowTrigger, default: WorkflowTrigger.MANUAL })
  trigger: WorkflowTrigger;

  @Column({ nullable: true })
  triggerEvent: string;

  @Column({ nullable: true })
  cronExpression: string;

  @Column({ type: 'jsonb' })
  steps: WorkflowStep[];

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ type: 'enum', enum: WorkflowStatus, default: WorkflowStatus.INACTIVE })
  status: WorkflowStatus;

  @Column({ type: 'int', default: 0 })
  totalRuns: number;

  @Column({ nullable: true })
  lastRunAt: Date;

  @Column({ type: 'text', nullable: true })
  lastError: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  agentName: string;
  toolId: string;
  toolName: string;
  input: Record<string, unknown>;
  outputKey: string;
  condition?: string;
  onFailure: 'stop' | 'skip' | 'retry';
  timeoutMs: number;
}
