import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface RealtimeTicket {
  ticket: string;
  /** Seconds the ticket stays valid; connect immediately after issuing. */
  expiresIn: number;
}

/**
 * Short-lived tickets for WebSocket handshakes.
 *
 * Sockets cannot ride the same-origin BFF proxy, and the browser no longer
 * holds the API bearer token (5.6). Instead the browser asks for a ticket over
 * the authenticated HTTP proxy and presents it once when connecting. The ticket
 * carries `typ: 'realtime'` so it can never be replayed as an API token, and it
 * expires in seconds.
 */
@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private static readonly TTL_SECONDS = 120;

  constructor(private readonly jwt: JwtService) {}

  issue(userId: string): RealtimeTicket {
    const ticket = this.jwt.sign(
      { sub: userId, typ: 'realtime' },
      { expiresIn: RealtimeService.TTL_SECONDS },
    );
    return { ticket, expiresIn: RealtimeService.TTL_SECONDS };
  }

  /** Returns the userId a ticket belongs to, or null when it is not valid. */
  verify(ticket: unknown): string | null {
    if (typeof ticket !== 'string' || ticket.length === 0) return null;
    try {
      const payload = this.jwt.verify<{ sub?: string; typ?: string }>(ticket);
      if (payload?.typ !== 'realtime' || !payload.sub) return null;
      return payload.sub;
    } catch {
      return null;
    }
  }
}
