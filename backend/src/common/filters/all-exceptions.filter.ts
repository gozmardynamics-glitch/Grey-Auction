import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';

/**
 * Global exception filter (M1). Shapes every error into a consistent JSON
 * envelope with a request id, logs full details server-side, and never leaks
 * raw DB/stack information to clients.
 *
 * Reuses the X-Request-Id set by RequestIdMiddleware when present; falls back
 * to generating a new UUID (should never happen if middleware is registered).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const requestId =
      (req as any).requestId ||
      (req.headers['x-request-id'] as string) ||
      randomUUID();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : ((body as Record<string, unknown>).message as string | string[]) || message;
    } else {
      const err = exception as Error;
      this.logger.error(
        '[%s] %s %s — %s',
        requestId,
        req.method,
        req.url,
        err?.message ?? String(exception),
        err?.stack,
      );
      message = 'Internal server error';
      // G50 — forward unhandled 5xx to an ops webhook (Slack/Discord-style)
      // when ERROR_WEBHOOK_URL is configured. Best-effort, never blocking.
      void this.reportError(requestId, req, err, exception);
    }

    res.setHeader('x-request-id', requestId);
    res.status(status).json({
      success: false,
      statusCode: status,
      requestId,
      message,
      path: req.url,
    });
  }

  private async reportError(
    requestId: string,
    req: Request,
    err: Error | undefined,
    exception: unknown,
  ): Promise<void> {
    try {
      const webhook = process.env.ERROR_WEBHOOK_URL;
      if (!webhook) return;
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text:
            '[GreyAuction] ' +
            (err?.message ?? String(exception)) +
            ' — ' +
            req.method +
            ' ' +
            req.url +
            ' (request ' +
            requestId +
            ')',
          requestId,
          method: req.method,
          url: req.url,
          error: err?.message ?? String(exception),
          stack: err?.stack,
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      /* alerting must never mask the original error */
    }
  }
}
