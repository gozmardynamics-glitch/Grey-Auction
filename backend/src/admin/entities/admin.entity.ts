import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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
