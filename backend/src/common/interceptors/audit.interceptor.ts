import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

import { AuditService } from '../../audit/audit.service';
import { AuditAction, AuditEntityType } from '../../audit/entities/audit-log.entity';

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Writes an audit row for every mutating admin API call.
 *
 * AuditService was fully implemented and called from nowhere, so the audit
 * console always showed an empty log — which is worse than not having one,
 * because it implies nothing has happened.
 *
 * Scope is deliberately narrow: admin routes only. Logging every authenticated
 * write would bury the useful signal in bid and read-tracking noise.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest();
    const method: string = request.method ?? '';
    const path: string = request.path ?? '';

    /**
     * Audit the actions that move money or change a person's standing, wherever
     * they live. Restricting this to `/admin/` meant an escrow refund or release
     * — the most consequential writes in the platform — left no audit trail,
     * because those routes live under `/escrow/`.
     */
    const MONEY_OR_STATUS_PATHS = ['/escrow/', '/disputes/', '/invoices/', '/settings/'];
    const auditable =
      path.includes('/admin/') ||
      MONEY_OR_STATUS_PATHS.some((prefix) => path.startsWith(prefix));
    if (!MUTATING.has(method) || !auditable) {
      return next.handle();
    }

    const userId: string | undefined = request.user?.id;
    if (!userId) return next.handle(); // unauthenticated attempts are the guard's business

    const record = () => {
      void this.audit
        .log(
          userId,
          {
            action: this.actionFor(method),
            entityType: this.entityTypeFor(path),
            entityId: this.entityIdFor(request),
            metadata: {
              method,
              path,
              params: request.params ?? {},
              // Bodies can carry KYC documents and credentials — never store them.
              bodyKeys: request.body ? Object.keys(request.body) : [],
            },
          },
          {
            ipAddress: request.ip,
            userAgent: request.headers?.['user-agent'],
            correlationId: request.requestId ?? request.headers?.['x-request-id'],
          },
        )
        .catch((error) =>
          this.logger.warn(`Audit write failed for ${method} ${path}: ${error.message}`),
        );
    };

    // Log only on success: a rejected attempt did not change state, and recording
    // it as though it had would be a lie in an audit trail.
    return next.handle().pipe(tap({ next: record }));
  }

  private actionFor(method: string): AuditAction {
    switch (method) {
      case 'POST':
        return AuditAction.CREATE;
      case 'PATCH':
      case 'PUT':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      default:
        return AuditAction.OTHER;
    }
  }

  /** Best-effort mapping from the URL to a domain entity. */
  private entityTypeFor(path: string): AuditEntityType {
    const segments = path.split('/').filter(Boolean);
    const adminIndex = segments.indexOf('admin');
    const subject = (segments[adminIndex + 1] ?? '').toLowerCase();

    const map: Record<string, AuditEntityType> = {
      users: AuditEntityType.USER,
      buyers: AuditEntityType.USER,
      admins: AuditEntityType.ADMIN,
      sellers: AuditEntityType.SELLER,
      products: AuditEntityType.PRODUCT,
      auctions: AuditEntityType.AUCTION,
      bids: AuditEntityType.BID,
      orders: AuditEntityType.ORDER,
      invoices: AuditEntityType.INVOICE,
      payments: AuditEntityType.PAYMENT,
      escrow: AuditEntityType.ESCROW,
      disputes: AuditEntityType.DISPUTE,
      settings: AuditEntityType.SETTINGS,
      fees: AuditEntityType.FEE_CONFIG,
      categories: AuditEntityType.CATEGORY,
      banners: AuditEntityType.BANNER,
      faqs: AuditEntityType.FAQ,
      tickets: AuditEntityType.TICKET,
      rooms: AuditEntityType.ROOM,
      invites: AuditEntityType.INVITE,
      kyc: AuditEntityType.OTHER,
      audit: AuditEntityType.OTHER,
      ai: AuditEntityType.OTHER,
      agents: AuditEntityType.OTHER,
    };
    return map[subject] ?? AuditEntityType.OTHER;
  }

  private entityIdFor(request: any): string | undefined {
    const candidate =
      request.params?.id ??
      request.params?.userId ??
      request.params?.productId ??
      request.params?.invoiceId ??
      request.body?.invoiceId ??
      request.body?.productId;
    // entityId is a uuid column; anything else is dropped rather than 500ing the write.
    if (typeof candidate !== 'string') return undefined;
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      candidate,
    )
      ? candidate
      : undefined;
  }
}
