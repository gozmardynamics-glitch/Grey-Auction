import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  APPROVE = 'approve',
  REJECT = 'reject',
  SUSPEND = 'suspend',
  ACTIVATE = 'activate',
  PAYMENT = 'payment',
  BID = 'bid',
  ESCROW = 'escrow',
  DISPUTE = 'dispute',
  VERIFY = 'verify',
  EXPORT = 'export',
  IMPORT = 'import',
  SETTINGS_CHANGE = 'settings_change',
  PERMISSION_CHANGE = 'permission_change',
  OTHER = 'other',
}

export enum AuditEntityType {
  USER = 'user',
  SELLER = 'seller',
  PRODUCT = 'product',
  AUCTION = 'auction',
  BID = 'bid',
  ORDER = 'order',
  INVOICE = 'invoice',
  PAYMENT = 'payment',
  ESCROW = 'escrow',
  DISPUTE = 'dispute',
  CONVERSATION = 'conversation',
  MESSAGE = 'message',
  SETTINGS = 'settings',
  FEE_CONFIG = 'fee_config',
  CATEGORY = 'category',
  BANNER = 'banner',
  FAQ = 'faq',
  TICKET = 'ticket',
  ROOM = 'room',
  INVITE = 'invite',
  ADMIN = 'admin',
  WATCHLIST = 'watchlist',
  PRODUCT_DOCUMENT = 'product_document',
  OTHER = 'other',
}

@Entity('audit_logs')
@Index(['userId'])
@Index(['entityType', 'entityId'])
@Index(['action'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'enum', enum: AuditEntityType })
  entityType: AuditEntityType;

  @Column({ type: 'uuid', nullable: true })
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  correlationId: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}