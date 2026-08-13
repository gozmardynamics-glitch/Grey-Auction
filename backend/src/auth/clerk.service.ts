import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createClerkClient, verifyToken as clerkVerifyToken } from '@clerk/backend';
import { User, UserRole } from './entities/user.entity';

export interface ClerkClaims {
  sub: string; // Clerk user ID
  email: string;
  name?: string;
  role?: string; // publicMetadata.role: buyer | seller | admin
}

/**
 * Clerk integration service.
 *
 * Verifies Clerk session tokens (JWT) issued by the Clerk instance and
 * synchronizes Clerk users into the local `users` table so existing
 * business logic (sellers, admins, bids, invoices) keeps working.
 *
 * Role mapping:
 *   Clerk publicMetadata.role  →  DB UserRole
 *   'buyer' | undefined        →  BIDDER
 *   'seller'                   →  SELLER
 *   'admin'                    →  ADMIN
 */
@Injectable()
export class ClerkService {
  private readonly logger = new Logger(ClerkService.name);
  private readonly clerk: ReturnType<typeof createClerkClient> | null;
  private readonly enabled: boolean;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    const secretKey = process.env.CLERK_SECRET_KEY;
    this.enabled = Boolean(secretKey);
    this.clerk = secretKey ? createClerkClient({ secretKey }) : null;

    if (!this.enabled) {
      this.logger.warn('CLERK_SECRET_KEY not set — Clerk auth disabled, using legacy JWT only');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Invite a user (usually the secondary contact person) as a member of a
   * Clerk Organization.
   */
  async inviteMember(
    organizationId: string,
    email: string,
    role: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.enabled || !this.clerk) {
      return {
        success: false,
        message: 'Clerk not configured — member invite skipped',
      };
    }

    try {
      await this.clerk.organizations.createOrganizationInvitation({
        organizationId,
        inviterUserId: '',
        emailAddress: email,
        role: role || 'org:member',
      });
      return { success: true, message: `Invited ${email} to organization` };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async verifyToken(token: string): Promise<ClerkClaims | null> {
    if (!this.enabled) return null;

    try {
      const payload = await clerkVerifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });

      const email = (payload.email as string) || '';
      const role = (payload.publicMetadata?.role as string) || 'buyer';

      return {
        sub: payload.sub,
        email,
        name: (payload.name as string) || email.split('@')[0],
        role,
      };
    } catch (error: any) {
      this.logger.debug(`Clerk token verification failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Upsert a Clerk user into the local users table.
   * Links by clerkId first, then by email (for legacy accounts).
   */
  async syncUser(claims: ClerkClaims): Promise<User> {
    let user = await this.userRepo.findOne({ where: { clerkId: claims.sub } });

    if (!user && claims.email) {
      user = await this.userRepo.findOne({ where: { email: claims.email } });
    }

    const role = this.mapRole(claims.role);

    if (user) {
      // Update link + role from Clerk metadata
      user.clerkId = claims.sub;
      if (!user.passwordHash) {
        // Clerk-managed accounts have no local password
        user.passwordHash = user.passwordHash || '';
      }
      if (claims.name) user.name = claims.name;
      user.role = role;
      user.isEmailVerified = true;
      return this.userRepo.save(user);
    }

    // New user — create with a placeholder password (auth goes through Clerk)
    user = this.userRepo.create({
      clerkId: claims.sub,
      email: claims.email || `clerk-${claims.sub}@clerk.local`,
      passwordHash: '',
      name: claims.name || claims.email?.split('@')[0] || 'User',
      role,
      isEmailVerified: true,
    });
    return this.userRepo.save(user);
  }

  private mapRole(clerkRole: string): UserRole {
    switch (clerkRole) {
      case 'seller':
        return UserRole.SELLER;
      case 'admin':
        return UserRole.ADMIN;
      case 'buyer':
      case 'bidder':
      default:
        return UserRole.BIDDER;
    }
  }
}
