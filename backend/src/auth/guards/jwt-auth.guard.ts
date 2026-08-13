import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { ClerkService } from '../clerk.service';

/**
 * Dual-mode auth guard:
 * 1. If the bearer token is a Clerk session token (JWT with issuer
 *    '*.clerk.accounts.dev'), verify via Clerk and sync the user.
 * 2. Otherwise fall back to the legacy local JWT (passport-jwt).
 *
 * The frontend now sends Clerk session tokens; legacy local JWTs still
 * work for backward compatibility (existing sessions, seed scripts).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly clerkService: ClerkService) {
    super();
  }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string = request.headers['authorization'] || '';

    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);

      const claims = await this.clerkService.verifyToken(token);
      if (claims) {
        // Clerk token — sync user and attach to request
        try {
          const user = await this.clerkService.syncUser(claims);
          request.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            clerkId: claims.sub,
          };
          return true;
        } catch (error: any) {
          this.logger.warn(`Clerk user sync failed: ${error.message}`);
          throw new UnauthorizedException('User sync failed');
        }
      }
    }

    // Fall back to legacy JWT strategy
    try {
      const result = await super.canActivate(context);
      if (typeof result === 'boolean') return result;
      return true;
    } catch (error: any) {
      throw new UnauthorizedException('Invalid or missing token');
    }
  }
}
