import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../auth/entities/user.entity';

export enum RoomStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  SETTLED = 'settled',
}

export enum RoomType {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ unique: true })
  roomCode: string;

  @Column({ type: 'enum', enum: RoomType, default: RoomType.PUBLIC })
  type: RoomType;

  @Column({ default: false })
  requiresDeposit: boolean;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  depositAmount: number;

  @Column({ default: false })
  requiresBidFee: boolean;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  bidFeeAmount: number;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column({ default: '7 days' })
  duration: string;

  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.SCHEDULED })
  status: RoomStatus;

  @Column({ default: false })
  allowInviteCode: boolean;

  @Column({ nullable: true })
  inviteCode: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  createdBy: User;

  @Column()
  createdById: string;

  @Column('simple-array', { default: '' })
  productIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('room_participants')
export class RoomParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Room)
  room: Room;

  @Column()
  roomId: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column()
  userId: string;

  @Column({ default: false })
  hasPaidDeposit: boolean;

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  joinedAt: Date;
}
