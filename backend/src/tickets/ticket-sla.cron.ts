import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TicketService } from './ticket.service';
import { EmailService } from '../common/email/email.service';

/**
 * Hourly service-level sweep for complaints.
 *
 * The Complaints Policy promises proactive updates: "if we cannot hit a date, we
 * tell you before it passes rather than after". That promise needs something to
 * notice the slip, which is this job. It nudges the complainant once per ticket —
 * `slaNotifiedAt` makes it idempotent, so a restart or a slow hour cannot send
 * the same apology twice.
 */
@Injectable()
export class TicketSlaCron {
  private readonly logger = new Logger(TicketSlaCron.name);
  private running = false;

  constructor(
    private readonly tickets: TicketService,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sweep(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const slipping = await this.tickets.findSlipping();
      if (!slipping.length) return;

      for (const ticket of slipping) {
        if (ticket.userEmail) {
          await this.emailService
            .sendEmail({
              to: ticket.userEmail,
              subject: `An update on your complaint — ${ticket.reference}`,
              html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:28px;background:#f8f8f8;">
                  <h2 style="color:#1a1a2e;margin:0 0 12px;">We are still working on your complaint</h2>
                  <p style="color:#333;line-height:1.6;">Your complaint (reference
                    <strong style="font-family:monospace;">${ticket.reference}</strong>) has passed the date we
                    aimed to answer by. We would rather tell you than let it pass quietly.</p>
                  <p style="color:#333;line-height:1.6;">It is still open and being handled. If you would like to add
                    anything, reply to it from your dashboard and it will reach the same case.</p>
                  <p style="color:#666;font-size:12px;line-height:1.6;">If our answer is still not good enough when it
                    arrives, you can ask for an internal review, and after that take it to the FCCPC.</p>
                </div>`,
            })
            .catch((error) =>
              this.logger.warn(`SLA notice failed for ${ticket.reference}: ${error.message}`),
            );
        }

        // Stamped even when the address is missing: the point of the stamp is to
        // stop the sweep retrying the same ticket every hour.
        await this.tickets.markSlaNotified(ticket.id);
        this.logger.warn(
          `Complaint ${ticket.reference} (${ticket.severity}) is past its SLA — notice sent`,
        );
      }
    } catch (error: any) {
      this.logger.error(`Complaint SLA sweep failed: ${error.message}`);
    } finally {
      this.running = false;
    }
  }
}
