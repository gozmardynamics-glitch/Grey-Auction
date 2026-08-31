import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Auth guard that validates local JWT tokens via passport-jwt strategy.
 *
 * The bearer token is verified against the local JWT_SECRET. On success,
 * the decoded payload (id, email, role) is attached to request.user.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const result = await super.canActivate(context);
      if (typeof result === 'boolean') return result;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or missing token');
    }
  }
}
