import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../entities/user.entity';

/**
 * Attaches `request.user` when a valid access token is present, and lets the
 * request through either way.
 *
 * Needed by routes that are public but expose MORE to their owner (for example
 * a lot's document list: verified documents are public, unverified ones are the
 * seller's business). The strict guard would reject anonymous callers.
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;
    if (!header?.startsWith('Bearer ')) return true;

    try {
      const payload = this.jwt.verify<{ sub?: string; typ?: string }>(header.slice(7));
      if (!payload?.sub) return true;
      // Purpose-bound tokens (password reset, realtime tickets) must never
      // authenticate a request.
      if (payload.typ && payload.typ !== 'access') return true;

      const user = await this.users.findOne({ where: { id: payload.sub } });
      if (user?.isActive) {
        request.user = { id: user.id, email: user.email, role: user.role };
      }
    } catch {
      // Invalid token: treat as anonymous rather than failing the request.
    }
    return true;
  }
}
