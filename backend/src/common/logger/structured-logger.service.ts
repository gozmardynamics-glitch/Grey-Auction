import { Injectable, LoggerService } from '@nestjs/common';
import { getRequestId } from './request-context';

type Level = 'log' | 'error' | 'warn' | 'debug' | 'verbose' | 'fatal';

/**
 * G50 — structured application logger.
 *
 * LOG_FORMAT=json (or NODE_ENV=production) → one JSON object per line:
 *   {"ts","level","ctx","msg","requestId"} — ingestible by Loki/Datadog/
 *   CloudWatch without a Winston/Pino dependency.
 * Otherwise → human-readable dev format that mirrors Nest's default.
 *
 * Registered as the app-wide logger in main.ts (app.useLogger), so Nest
 * bootstrap messages, this.logger.* calls and framework internals all flow
 * through here. The AllExceptionsFilter additionally forwards 5xx payloads
 * to ERROR_WEBHOOK_URL when configured (Slack/Discord-compatible).
 */
@Injectable()
export class StructuredLoggerService implements LoggerService {
  private readonly json =
    process.env.LOG_FORMAT === 'json' || process.env.NODE_ENV === 'production';

  private emit(level: Level, message: unknown, context?: string) {
    if (!this.json) {
      const origin = context ? ` [${context}] ` : ' ';
      const sink =
        level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      sink(`${new Date().toISOString()}${origin}${String(message)}`);
      return;
    }
    const entry: Record<string, unknown> = {
      ts: new Date().toISOString(),
      level,
      ctx: context ?? null,
      msg: typeof message === 'string' ? message : JSON.stringify(message),
    };
    const requestId = getRequestId();
    if (requestId) entry.requestId = requestId;
    const line = JSON.stringify(entry);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  }

  log(message: unknown, context?: string) {
    this.emit('log', message, context);
  }

  error(message: unknown, stack?: string, context?: string) {
    this.emit('error', stack ? `${String(message)} — ${stack}` : message, context);
  }

  warn(message: unknown, context?: string) {
    this.emit('warn', message, context);
  }

  debug(message: unknown, context?: string) {
    // Keep dev consoles readable; JSON consumers can filter by level.
    if (!this.json) return;
    this.emit('debug', message, context);
  }

  verbose(message: unknown, context?: string) {
    if (!this.json) return;
    this.emit('verbose', message, context);
  }

  fatal(message: unknown, context?: string) {
    this.emit('fatal', message, context);
  }
}
