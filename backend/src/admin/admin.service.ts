import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin, AdminRole } from './entities/admin.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Admin) private readonly adminRepo: Repository<Admin>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  // ─── Admins CRUD ────────────────────────────────────────────────
  async findAllAdmins() {
    return this.adminRepo.find({
      select: ['id', 'email', 'name', 'role', 'isActive', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Platform password policy for administrative accounts. */
  static assertPasswordPolicy(password: string): void {
    const problems: string[] = [];
    if (password.length < 12) problems.push('at least 12 characters');
    if (!/[A-Z]/.test(password)) problems.push('an uppercase letter');
    if (!/[a-z]/.test(password)) problems.push('a lowercase letter');
    if (!/[0-9]/.test(password)) problems.push('a digit');
    if (!/[^A-Za-z0-9]/.test(password)) problems.push('a special character');
    if (problems.length) {
      throw new BadRequestException(
        'Password must contain ' + problems.join(', ') + '.',
      );
    }
  }

  async createAdmin(dto: { email: string; password: string; name: string; role?: AdminRole }) {
    AdminService.assertPasswordPolicy(dto.password);
    const existing = await this.adminRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Admin with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const admin = this.adminRepo.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      role: dto.role || AdminRole.PLATFORM_ADMIN,
    });
    const saved = await this.adminRepo.save(admin);
    const { passwordHash: _ph, ...result } = saved;
    return result;
  }

  async updateAdmin(id: string, dto: { name?: string; role?: AdminRole; isActive?: boolean }) {
    const admin = await this.adminRepo.findOne({ where: { id } });
    if (!admin) throw new NotFoundException('Admin not found');
    Object.assign(admin, dto);
    await this.adminRepo.save(admin);
    const { passwordHash: _ph, ...result } = admin;
    return result;
  }

  async removeAdmin(id: string) {
    const admin = await this.adminRepo.findOne({ where: { id } });
    if (!admin) throw new NotFoundException('Admin not found');
    if (admin.role === AdminRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot delete a super admin');
    }
    await this.adminRepo.remove(admin);
    return { success: true };
  }

  // ─── Users (any role) ───────────────────────────────────────────
  /**
   * Create a user with an explicit role. The public registration DTO
   * deliberately restricts roles to bidder|seller, so privileged creation
   * lives here behind the admin guard.
   */
  async createUser(dto: {
    email: string;
    password: string;
    name: string;
    role?: 'bidder' | 'seller' | 'admin';
  }) {
    const email = (dto.email || '').trim().toLowerCase();
    if (!email || !dto.password || !dto.name) {
      throw new BadRequestException('email, password and name are required');
    }
    if (dto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('A user with this email already exists');
    }

    const roleMap: Record<string, UserRole> = {
      bidder: UserRole.BIDDER,
      seller: UserRole.SELLER,
      admin: UserRole.ADMIN,
    };
    const role = roleMap[dto.role || 'bidder'] ?? UserRole.BIDDER;

    const user = this.userRepo.create({
      email,
      passwordHash: await bcrypt.hash(dto.password, 10),
      name: dto.name.trim(),
      role,
      isEmailVerified: true,
    });
    const saved = await this.userRepo.save(user);
    const { passwordHash: _ph, ...result } = saved;
    return result;
  }

  // ─── Buyers Management ──────────────────────────────────────────
  async findAllBuyers() {
    return this.userRepo.find({
      where: { role: UserRole.BIDDER },
      select: ['id', 'email', 'name', 'isActive', 'isEmailVerified', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async setBuyerStatus(id: string, isActive: boolean) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Buyer not found');
    user.isActive = isActive;
    await this.userRepo.save(user);
    return { success: true, id, isActive };
  }
}
