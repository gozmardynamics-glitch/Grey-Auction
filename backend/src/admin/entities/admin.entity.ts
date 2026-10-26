import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  PLATFORM_ADMIN = 'platform_admin',
  SUPPORT_ADMIN = 'support_admin',
  FINANCE_ADMIN = 'finance_admin',
}

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  name: string;

  // The admins row that carries authority MUST be linked to the users row that
  // authenticates. Email-string matching (the old scheme) let any user who
  // set their users.email to an admin address inherit that admin's power.
  // Unique + nullable: legacy rows backfill via the seed script; null means
  // "no JWT authority yet".
  @Column({ type: 'uuid', nullable: true })
  @Index('UQ_admin_user', ['userId'], { unique: true })
  userId: string | null;

  @Column({
    type: 'enum',
    enum: AdminRole,
    default: AdminRole.PLATFORM_ADMIN,
  })
  role: AdminRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
