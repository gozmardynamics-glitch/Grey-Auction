import { Injectable, NotFoundException, BadRequestException, Logger, ConflictException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { WalletService } from '../wallet/wallet.service';
import { WalletTransactionType } from '../wallet/wallet-transaction.entity';
import { Ticket, TicketSeverity, TicketStatus } from '../tickets/ticket.entity';
import { Admin, AdminRole } from './entities/admin.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Admin) private readonly adminRepo: Repository<Admin>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Ticket) private readonly ticketRepo: Repository<Ticket>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly walletService: WalletService,
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
    // Link the JWT login account when one already exists for this address —
    // AdminRolesGuard grants authority only through admins.user_id.
    await this.linkUser(saved);
    const { passwordHash: _ph, ...result } = saved;
    return result;
  }

  /** Attach admins.user_id for the users row sharing this admin's email (idempotent). */
  private async linkUser(admin: Admin): Promise<void> {
    if (admin.userId) return;
    const user = await this.userRepo.findOne({ where: { email: admin.email } });
    if (!user) return;
    admin.userId = user.id;
    await this.adminRepo.save(admin);
  }

  /** Backfill the user link for legacy admins created before the link column. */
  async backfillUserLinks(): Promise<number> {
    const unlinked = await this.adminRepo.find({ where: { userId: null as any } });
    let linked = 0;
    for (const admin of unlinked) {
      const before = admin.userId;
      await this.linkUser(admin);
      if (admin.userId && admin.userId !== before) linked++;
    }
    return linked;
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

  /**
   * Goodwill credit: the remedy a complaint handler actually needs when the
   * answer is "we were wrong, here is something back" but no escrow hold is
   * involved (a fee overcharge, a delay, a service failure).
   *
   * It is a ledger entry, not a balance edit: the reason is required, the
   * reference is unique so a retry cannot double-credit, and the type is
   * ADJUSTMENT so it never looks like a customer deposit in reporting.
   */
  async creditWallet(userId: string, input: { amount: number; reason: string }) {
    const amount = Math.round(Number(input.amount) * 100) / 100;
    if (!(amount > 0)) throw new BadRequestException('A credit amount is required');
    if (!input.reason || !input.reason.trim()) {
      throw new BadRequestException('A reason is required for a goodwill credit');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Account not found');

    const reference = `goodwill:${randomUUID()}`;
    await this.dataSource.transaction((manager) =>
      this.walletService.creditInManager(manager, userId, {
        amount,
        reference,
        description: `Goodwill credit: ${input.reason.trim()}`,
        type: WalletTransactionType.ADJUSTMENT,
      }),
    );

    return { userId, amount, reference, reason: input.reason.trim() };
  }

  /**
   * Suspend or reinstate a buyer.
   *
   * Suspending someone while a money complaint of theirs is open looks like
   * retaliation, and it is the kind of thing a regulator reads badly — so it is
   * refused rather than left to judgement. An admin who genuinely needs to act
   * during an open complaint can pass `force`, which is recorded on the returned
   * result so the decision is visible afterwards.
   */
  async setBuyerStatus(id: string, isActive: boolean, options: { force?: boolean } = {}) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Buyer not found');

    let openComplaints: Ticket[] = [];
    if (!isActive) {
      openComplaints = await this.ticketRepo.find({
        where: {
          userId: id,
          status: Not(In([TicketStatus.RESOLVED, TicketStatus.CLOSED])),
          severity: In([TicketSeverity.P1, TicketSeverity.P2]),
        },
        take: 5,
      });
      if (openComplaints.length && !options.force) {
        throw new ConflictException(
          `This account has ${openComplaints.length} open complaint(s) that concern money ` +
            `(${openComplaints.map((ticket) => ticket.reference).join(', ')}). ` +
            'Resolve them first, or repeat the request with force=true and a recorded reason.',
        );
      }
    }

    user.isActive = isActive;
    await this.userRepo.save(user);
    return {
      success: true,
      id,
      isActive,
      ...(openComplaints.length && {
        suspendedDuringComplaints: openComplaints.map((ticket) => ticket.reference),
      }),
    };
  }
}
