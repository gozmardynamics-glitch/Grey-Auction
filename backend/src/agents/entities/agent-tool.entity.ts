import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('agent_tools')
export class AgentTool {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  category: string;

  @Column()
  endpoint: string;

  @Column({ default: 'GET' })
  httpMethod: string;

  @Column({ type: 'jsonb', nullable: true })
  inputSchema: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  outputSchema: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  headers: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  examples: Record<string, unknown>[];

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ default: false })
  requiresAuth: boolean;

  @Column({ type: 'int', default: 15000 })
  timeoutMs: number;

  @Column({ type: 'bigint', default: 0 })
  totalCalls: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 100 })
  successRate: number;

  @Column({ nullable: true })
  lastCalledAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
