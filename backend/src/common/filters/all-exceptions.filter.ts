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
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const requestId =
      (req.headers['x-request-id'] as string) || randomUUID();

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
}
