import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;
  private readonly httpRequestDuration: Histogram;
  private readonly httpRequestsTotal: Counter;
  private readonly activeUsers: Gauge;
  private readonly dbConnections: Gauge;
  private readonly activeAuctions: Gauge;
  private readonly totalRevenue: Counter;
  private readonly bidCount: Counter;
  private readonly userRegistrations: Counter;
  private readonly queueAvailable: Gauge;
  private readonly queueUnavailable: Counter;
  private readonly inlineSettlements: Counter;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.registry = new Registry();

    // Enable default metrics (CPU, memory, event loop, etc.)
    collectDefaultMetrics({ register: this.registry, prefix: 'app_' });

    // HTTP request duration histogram
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    // HTTP requests total counter
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    // Active users gauge
    this.activeUsers = new Gauge({
      name: 'active_users',
      help: 'Number of currently active users',
      registers: [this.registry],
    });

    // Database connections gauge
    this.dbConnections = new Gauge({
      name: 'db_connections_active',
      help: 'Number of active database connections',
      registers: [this.registry],
    });

    // Active auctions gauge
    this.activeAuctions = new Gauge({
      name: 'active_auctions',
      help: 'Number of currently active auctions',
      registers: [this.registry],
    });

    // Total revenue counter
    this.totalRevenue = new Counter({
      name: 'total_revenue_cents',
      help: 'Total revenue in cents',
      registers: [this.registry],
    });

    // Bid count counter
    this.bidCount = new Counter({
      name: 'bids_total',
      help: 'Total number of bids placed',
      registers: [this.registry],
    });

    // User registrations counter
    this.userRegistrations = new Counter({
      name: 'user_registrations_total',
      help: 'Total number of user registrations',
      labelNames: ['role'],
      registers: [this.registry],
    });

    // Settlement queue health (5.10): without these, a Redis outage degrades
    // settlement to inline mode with nothing but a log line to notice it.
    this.queueAvailable = new Gauge({
      name: 'settlement_queue_available',
      help: '1 when the settlement queue (Redis) is reachable, 0 when degraded to inline settlement',
      registers: [this.registry],
    });

    this.queueUnavailable = new Counter({
      name: 'settlement_queue_unavailable_total',
      help: 'Number of times the settlement queue probe failed',
      registers: [this.registry],
    });

    this.inlineSettlements = new Counter({
      name: 'settlement_inline_total',
      help: 'Settlement ticks that ran inline because the queue was unavailable',
      registers: [this.registry],
    });
  }

  onModuleInit(): void {
    // Update DB connections gauge periodically
    setInterval(() => this.updateDbConnections(), 30000);
  }

  private async updateDbConnections(): Promise<void> {
    try {
      const pool = (this.dataSource.driver as any).master?.pool;
      if (pool) {
        this.dbConnections.set(pool.totalCount || 0);
      }
    } catch {
      // Ignore errors in metrics collection
    }
  }

  // HTTP metrics
  recordHttpRequest(method: string, route: string, statusCode: number, durationSeconds: number): void {
    this.httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, durationSeconds);
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
  }

  // Business metrics
  setActiveUsers(count: number): void {
    this.activeUsers.set(count);
  }

  setActiveAuctions(count: number): void {
    this.activeAuctions.set(count);
  }

  incrementRevenue(cents: number): void {
    this.totalRevenue.inc(cents);
  }

  incrementBidCount(): void {
    this.bidCount.inc();
  }

  incrementUserRegistrations(role: string): void {
    this.userRegistrations.inc({ role });
  }

  /** Queue health: 1 reachable, 0 degraded. */
  setQueueAvailable(available: boolean): void {
    this.queueAvailable.set(available ? 1 : 0);
    if (!available) this.queueUnavailable.inc();
  }

  /** A settlement tick that had to run inline because the queue was down. */
  incrementInlineSettlement(): void {
    this.inlineSettlements.inc();
  }

  // Get metrics
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  async getContentType(): Promise<string> {
    return this.registry.contentType;
  }

  // Get registry for advanced usage
  getRegistry(): Registry {
    return this.registry;
  }
}