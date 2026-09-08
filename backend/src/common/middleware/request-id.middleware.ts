import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { requestLogContext } from '../logger/request-context';

/**
 * Attaches a unique request id to every request/response.
 * - Reads incoming X-Request-Id header (for distributed tracing) or generates one.
 * - Sets X-Request-Id on the response so clients can correlate errors.
 * - Stores the id on req.requestId for downstream logging.
 * - G50: also opens an AsyncLocalStorage store so the structured logger can
 *   stamp requestId onto every log line emitted during this request.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    (req as any).requestId = requestId;
    res.setHeader('x-request-id', requestId);
    requestLogContext.run({ requestId, method: req.method, url: req.url }, () => next());
  }
}
