import { Injectable } from '@nestjs/common';
import { TicketCategory, TicketSeverity, TicketStatus } from './ticket.entity';

/** Service levels published in the Complaints Policy (/complaints). */
export const ACK_BUSINESS_DAYS: Record<TicketSeverity, number> = {
  [TicketSeverity.P1]: 1,
  [TicketSeverity.P2]: 2,
  [TicketSeverity.P3]: 2,
  [TicketSeverity.P4]: 2,
};

export const RESOLVE_BUSINESS_DAYS: Record<TicketSeverity, number> = {
  [TicketSeverity.P1]: 5,
  [TicketSeverity.P2]: 10,
  [TicketSeverity.P3]: 15,
  [TicketSeverity.P4]: 20,
};

/**
 * Category → severity. Money that has moved or is held is P1; a broken sale is
 * P2; how we behaved is P3; feedback is P4. A data-protection complaint is P1
 * because it starts a statutory clock, not because it is louder.
 */
export const SEVERITY_BY_CATEGORY: Record<TicketCategory, TicketSeverity> = {
  [TicketCategory.ESCROW]: TicketSeverity.P1,
  [TicketCategory.PAYOUTS]: TicketSeverity.P1,
  [TicketCategory.DATA_PROTECTION]: TicketSeverity.P1,
  [TicketCategory.PAYMENTS]: TicketSeverity.P2,
  [TicketCategory.LISTING]: TicketSeverity.P2,
  [TicketCategory.DELIVERY]: TicketSeverity.P2,
  [TicketCategory.BIDDING]: TicketSeverity.P3,
  [TicketCategory.ACCOUNT]: TicketSeverity.P3,
  [TicketCategory.OTHER]: TicketSeverity.P4,
};

/** Statutory response window for a data-protection complaint (calendar days). */
export const STATUTORY_DP_DAYS = 30;

export type SlaState = 'met' | 'on_track' | 'due_soon' | 'overdue' | 'closed';

export interface SlaView {
  state: SlaState;
  /**
   * Data-protection complaints carry a statutory response window on top of the
   * internal SLA (30 days). Present only for that category, so the admin queue
   * can show a legal deadline rather than an operational one.
   */
  statutoryDueAt?: Date | null;
  statutoryDaysLeft?: number | null;
  /** Business days left (negative when overdue). */
  businessDaysLeft: number | null;
  dueAt: Date | null;
  acknowledged: boolean;
  firstResponded: boolean;
}

/**
 * Service-level arithmetic for complaints.
 *
 * Business days only: weekends are skipped. Nigerian public holidays are not
 * modelled — the policy says so, and a holiday simply buys the ticket a day,
 * which fails in the complainant's favour rather than ours.
 */
@Injectable()
export class TicketSlaService {
  severityFor(category: TicketCategory | string | undefined): TicketSeverity {
    const key = String(category || '').toLowerCase() as TicketCategory;
    return SEVERITY_BY_CATEGORY[key] ?? TicketSeverity.P3;
  }

  /** Add N business days (Mon–Fri) to a moment. */
  addBusinessDays(from: Date, days: number): Date {
    const date = new Date(from.getTime());
    let remaining = Math.max(0, days);
    while (remaining > 0) {
      date.setDate(date.getDate() + 1);
      const day = date.getDay();
      if (day !== 0 && day !== 6) remaining -= 1;
    }
    return date;
  }

  /** Whole business days between two moments (negative when `to` is past). */
  businessDaysBetween(from: Date, to: Date): number {
    const start = new Date(from.getTime());
    const end = new Date(to.getTime());
    const forward = end >= start;
    let count = 0;
    const cursor = new Date(start.getTime());
    while (forward ? cursor < end : cursor > end) {
      if (forward) cursor.setDate(cursor.getDate() + 1);
      else cursor.setDate(cursor.getDate() - 1);
      const day = cursor.getDay();
      if (day !== 0 && day !== 6) count += forward ? 1 : -1;
    }
    return count;
  }

  /** The two clocks a new ticket starts. */
  schedule(severity: TicketSeverity, now = new Date()): { acknowledgedBy: Date; dueAt: Date } {
    return {
      acknowledgedBy: this.addBusinessDays(now, ACK_BUSINESS_DAYS[severity]),
      dueAt: this.addBusinessDays(now, RESOLVE_BUSINESS_DAYS[severity]),
    };
  }

  /**
   * Where the ticket stands against its deadline.
   *
   * `due_soon` is the window the policy promises to warn in — inside one business
   * day of the deadline, before it is missed.
   */
  view(
    ticket: {
      status?: TicketStatus | string;
      category?: TicketCategory | string | null;
      createdAt?: Date | null;
      dueAt?: Date | null;
      acknowledgedAt?: Date | null;
      firstResponseAt?: Date | null;
    },
    now = new Date(),
  ): SlaView {
    const statutory = this.statutoryView(ticket, now);
    const status = String(ticket.status || '');
    const closed = status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED;
    const dueAt = ticket.dueAt ? new Date(ticket.dueAt) : null;
    const acknowledged = Boolean(ticket.acknowledgedAt);
    const firstResponded = Boolean(ticket.firstResponseAt);

    if (closed) {
      return { state: 'closed', businessDaysLeft: null, dueAt, acknowledged, firstResponded, ...statutory };
    }
    if (!dueAt) {
      return { state: 'on_track', businessDaysLeft: null, dueAt: null, acknowledged, firstResponded, ...statutory };
    }

    const left = this.businessDaysBetween(now, dueAt);
    const overdue = dueAt.getTime() <= now.getTime();
    const state: SlaState = overdue ? 'overdue' : left <= 1 ? 'due_soon' : 'on_track';
    return { state, businessDaysLeft: left, dueAt, acknowledged, firstResponded, ...statutory };
  }

  /**
   * The statutory window for a data-protection complaint: 30 calendar days from
   * when it was raised. Calendar, not business, because the obligation runs on
   * days rather than working weeks.
   */
  private statutoryView(
    ticket: { category?: TicketCategory | string | null; createdAt?: Date | null },
    now: Date,
  ): { statutoryDueAt?: Date | null; statutoryDaysLeft?: number | null } {
    if (String(ticket.category || '') !== TicketCategory.DATA_PROTECTION) return {};
    const raised = ticket.createdAt ? new Date(ticket.createdAt) : null;
    if (!raised) return {};
    const due = new Date(raised.getTime() + STATUTORY_DP_DAYS * 86_400_000);
    const daysLeft = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
    return { statutoryDueAt: due, statutoryDaysLeft: daysLeft };
  }

  /** Reference quoted to the complainant: TKT-2026-000042. */
  reference(sequence: number, now = new Date()): string {
    return `TKT-${now.getFullYear()}-${String(sequence).padStart(6, '0')}`;
  }
}
