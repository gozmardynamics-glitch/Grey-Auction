import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { EmailSubscription, SubscriptionStatus } from './subscription.entity';
import { EmailService } from '../common/email/email.service';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly brevoApiKey = process.env.BREVO_API_KEY || '';
  private readonly contactListId = process.env.BREVO_CONTACT_LIST_ID || '';

  constructor(
    @InjectRepository(EmailSubscription)
    private readonly repo: Repository<EmailSubscription>,
    private readonly emailService: EmailService,
  ) {}

  /** Create (or refresh) a pending subscription and send the opt-in email. */
  async subscribe(email: string): Promise<EmailSubscription> {
    const normalized = email.trim().toLowerCase();
    const existing = await this.repo.findOne({ where: { email: normalized } });

    if (existing) {
      if (existing.status === SubscriptionStatus.CONFIRMED) {
        return existing;
      }
      if (existing.status === SubscriptionStatus.UNSUBSCRIBED) {
        existing.status = SubscriptionStatus.PENDING;
        existing.token = randomBytes(32).toString('hex');
        const saved = await this.repo.save(existing);
        await this.sendOptIn(saved).catch((e) => this.logger.warn(e.message));
        return saved;
      }
      // Already pending: resend the opt-in (idempotent).
      await this.sendOptIn(existing).catch((e) => this.logger.warn(e.message));
      return existing;
    }

    const sub = this.repo.create({
      email: normalized,
      token: randomBytes(32).toString('hex'),
      status: SubscriptionStatus.PENDING,
    });
    const saved = await this.repo.save(sub);
    await this.sendOptIn(saved).catch((e) => this.logger.warn(e.message));
    return saved;
  }

  /** Confirm a subscription from the double opt-in link. */
  async confirm(token: string): Promise<EmailSubscription> {
    const sub = await this.repo.findOne({ where: { token } });
    if (!sub || sub.status === SubscriptionStatus.UNSUBSCRIBED) {
      throw new Error('Invalid or expired confirmation token');
    }
    if (sub.status === SubscriptionStatus.CONFIRMED) {
      return sub;
    }
    sub.status = SubscriptionStatus.CONFIRMED;
    const saved = await this.repo.save(sub);
    await this.syncBrevoContact(saved).catch((e) => this.logger.warn(e.message));
    return saved;
  }

  async unsubscribe(email: string): Promise<{ success: boolean }> {
    const sub = await this.repo.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!sub) return { success: true };
    sub.status = SubscriptionStatus.UNSUBSCRIBED;
    await this.repo.save(sub);
    return { success: true };
  }

  private async sendOptIn(sub: EmailSubscription): Promise<void> {
    const base = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = base + '/subscribe/confirm?token=' + encodeURIComponent(sub.token);
    const html =
      '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;background:#f8f8f8;">' +
      '<h2 style="color:#1a1a2e;">Confirm your subscription</h2>' +
      '<p style="color:#333;line-height:1.6;">Thanks for subscribing to GreyAuction updates. Confirm your email address to start receiving them.</p>' +
      '<div style="text-align:center;margin:24px 0;"><a href="' + link + '" style="background:#e94560;color:#fff;padding:12px 28px;text-decoration:none;border-radius:5px;font-weight:bold;">Confirm subscription</a></div>' +
      '<p style="color:#666;font-size:12px;">If you did not request this, you can ignore this email.</p>' +
      '</div>';
    await this.emailService.sendEmail({
      to: sub.email,
      subject: 'Confirm your GreyAuction subscription',
      html,
    });
  }

  /** Add the confirmed email to a Brevo contact list (best-effort). */
  private async syncBrevoContact(sub: EmailSubscription): Promise<void> {
    if (!this.brevoApiKey || !this.contactListId) return;
    await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': this.brevoApiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: sub.email,
        listIds: [Number(this.contactListId)],
        updateEnabled: true,
      }),
      signal: AbortSignal.timeout(10000),
    });
  }
}
