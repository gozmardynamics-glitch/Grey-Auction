import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

import { MetricsService } from '../../metrics/metrics.service';

/**
 * Feeds real request telemetry into the Prometheus registry.
 *
 * MetricsService.recordHttpRequest existed but nothing ever called it, so
 * /metrics exposed only process CPU/memory and no traffic at all.
 *
 * The route label uses the matched path pattern (`/products/:id`) rather than the
 * raw URL, otherwise every id becomes its own label value and the metric
 * cardinality explodes.
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();

    // Self-scrape would pollute request metrics with the scrape itself.
    const path: string = request.route?.path
      ? `${request.baseUrl ?? ''}${request.route.path}`
      : request.path ?? 'unknown';
    if (path.endsWith('/metrics')) return next.handle();

    const method: string = request.method ?? 'GET';
    const startedAt = process.hrtime.bigint();

    const record = () => {
      const seconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
      this.metrics.recordHttpRequest(
        method,
        path,
        response.statusCode ?? 0,
        seconds,
      );
    };

    return next.handle().pipe(
      tap({
        next: record,
        error: record,
      }),
    );
  }
}
