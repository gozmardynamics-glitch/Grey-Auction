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

  async createAdmin(dto: { email: string; password: string; name: string; role?: AdminRole }) {
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
