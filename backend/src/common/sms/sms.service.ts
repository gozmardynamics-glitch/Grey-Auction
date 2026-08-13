import { Injectable, Logger } from '@nestjs/common';

export interface SmsOptions {
  to: string; // E.164 format, e.g. +2348012345678
  message: string;
}

/**
 * SMS notification service.
 *
 * Primary provider: Termii (Nigeria-focused, https://termii.com)
 * Configuration via env vars — when TERMII_API_KEY is missing (dev),
 * messages are logged to console instead of being sent.
 *
 * Env vars:
 *   TERMII_API_KEY    — Termii API key
 *   TERMII_SENDER_ID  — Sender ID (e.g. "GreyAuct")
 *   TERMII_CHANNEL    — 'dnd' | 'generic' | 'whatsapp' (default 'generic')
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey: string;
  private readonly senderId: string;
  private readonly channel: string;

  constructor() {
    this.apiKey = process.env.TERMII_API_KEY || '';
    this.senderId = process.env.TERMII_SENDER_ID || 'GreyAuct';
    this.channel = process.env.TERMII_CHANNEL || 'generic';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async sendSms(options: SmsOptions): Promise<boolean> {
    if (!this.apiKey) {
      this.logSms(options);
      return false;
    }

    try {
      const url =
        this.channel === 'whatsapp'
          ? 'https://api.termii.com/api/send/message'
          : 'https://api.termii.com/api/sms/send';

      const payload: Record<string, unknown> = {
        api_key: this.apiKey,
        to: options.to,
        sms: options.message,
        from: this.senderId,
        type: 'plain',
      };

      if (this.channel === 'dnd') {
        payload.channel = 'dnd';
      } else if (this.channel === 'whatsapp') {
        payload.channel = 'whatsapp';
        payload.from = this.senderId.replace('wa:', 'wa:');
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        this.logger.warn(`SMS send failed: ${res.status} ${errText}`);
        this.logSms(options);
        return false;
      }

      this.logger.log(`SMS sent to ${options.to}`);
      return true;
    } catch (error: any) {
      this.logger.warn(`SMS send error: ${error.message}`);
      this.logSms(options);
      return false;
    }
  }

  /**
   * Convenience: send a room invite via SMS.
   */
  async sendRoomInviteSms(
    to: string,
    data: { roomName: string; inviteLink: string },
  ): Promise<boolean> {
    return this.sendSms({
      to,
      message: `You've been invited to a private auction — ${data.roomName}! Join here: ${data.inviteLink}`,
    });
  }

  private logSms(options: SmsOptions): void {
    this.logger.log('──────────────────────────────────────────');
    this.logger.log(`📱 SMS (DEV — no TERMII_API_KEY set)`);
    this.logger.log(`   To:      ${options.to}`);
    this.logger.log(`   Message: ${options.message}`);
    this.logger.log('──────────────────────────────────────────');
  }
}
