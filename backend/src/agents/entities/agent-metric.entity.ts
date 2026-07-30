import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('agent_metrics')
export class AgentMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  agentId: string;

  @Column()
  agentName: string;

  @Column()
  eventType: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown>;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  latencyMs: number;

  @Column()
  success: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'decimal', precision: 12, scale: 6, default: 0 })
  costEstimate: number;

  @CreateDateColumn()
  createdAt: Date;
}
