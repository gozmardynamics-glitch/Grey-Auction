import { Injectable, Logger } from '@nestjs/common';

export interface SmsOptions {
  to: string; // E.164 format, e.g. +2348012345678
  message: string;
}

/**
 * SMS notification service.
 *
 * Providers (env-driven; first configured provider wins, otherwise the
 * message is logged to console in dev):
 *   1. Termii (Nigeria-focused, https://termii.com)
 *      TERMII_API_KEY / TERMII_SENDER_ID / TERMII_CHANNEL
 *   2. Twilio (https://twilio.com)
 *      TWILIO_ACCOUNT_SID + (TWILIO_AUTH_TOKEN | TWILIO_API_KEY_SID/TWILIO_API_KEY_SECRET)
 *      TWILIO_FROM_NUMBER (your Twilio phone number in E.164)
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  // Termii
  private readonly termiiApiKey: string;
  private readonly senderId: string;
  private readonly channel: string;

  // Twilio
  private readonly twilioAccountSid: string;
  private readonly twilioApiKeySid: string;
  private readonly twilioApiKeySecret: string;
  private readonly twilioAuthToken: string;
  private readonly twilioFromNumber: string;

  constructor() {
    this.termiiApiKey = process.env.TERMII_API_KEY || '';
    this.senderId = process.env.TERMII_SENDER_ID || 'GreyAuct';
    this.channel = process.env.TERMII_CHANNEL || 'generic';

    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.twilioApiKeySid = process.env.TWILIO_API_KEY_SID || '';
    this.twilioApiKeySecret = process.env.TWILIO_API_KEY_SECRET || '';
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.twilioFromNumber = process.env.TWILIO_FROM_NUMBER || '';
  }

  isConfigured(): boolean {
    return this.isTermiiConfigured() || this.isTwilioConfigured();
  }

  private isTermiiConfigured(): boolean {
    return Boolean(this.termiiApiKey);
  }

  private isTwilioConfigured(): boolean {
    return Boolean(this.twilioFromNumber) && Boolean(
      this.twilioAccountSid &&
        (this.twilioAuthToken || (this.twilioApiKeySid && this.twilioApiKeySecret)),
    );
  }

  async sendSms(options: SmsOptions): Promise<boolean> {
    if (this.isTermiiConfigured()) {
      return this.sendViaTermii(options);
    }
    if (this.isTwilioConfigured()) {
      return this.sendViaTwilio(options);
    }

    this.logSms(options);
    return false;
  }

  private async sendViaTermii(options: SmsOptions): Promise<boolean> {
    try {
      const url =
        this.channel === 'whatsapp'
          ? 'https://api.termii.com/api/send/message'
          : 'https://api.termii.com/api/sms/send';

      const payload: Record<string, unknown> = {
        api_key: this.termiiApiKey,
        to: options.to,
        sms: options.message,
        from: this.senderId,
        type: 'plain',
      };

      if (this.channel === 'dnd') {
        payload.channel = 'dnd';
      } else if (this.channel === 'whatsapp') {
        payload.channel = 'whatsapp';
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        this.logger.warn(`Termii SMS send failed: ${res.status} ${errText}`);
        this.logSms(options);
        return false;
      }

      this.logger.log(`SMS sent via Termii to ${options.to}`);
      return true;
    } catch (error: any) {
      this.logger.warn(`Termii SMS send error: ${error.message}`);
      this.logSms(options);
      return false;
    }
  }

  private async sendViaTwilio(options: SmsOptions): Promise<boolean> {
    try {
      // Authenticate with API Key (SK + secret) when provided, else Auth Token
      const username = this.twilioApiKeySid || this.twilioAccountSid;
      const password = this.twilioApiKeySecret || this.twilioAuthToken;

      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`;

      const form = new URLSearchParams({
        To: options.to,
        From: this.twilioFromNumber,
        Body: options.message,
      });

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        this.logger.warn(`Twilio SMS send failed: ${res.status} ${errText}`);
        this.logSms(options);
        return false;
      }

      this.logger.log(`SMS sent via Twilio to ${options.to}`);
      return true;
    } catch (error: any) {
      this.logger.warn(`Twilio SMS send error: ${error.message}`);
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
    this.logger.log('📱 SMS (DEV — no SMS provider configured)');
    this.logger.log(`   To:      ${options.to}`);
    this.logger.log(`   Message: ${options.message}`);
    this.logger.log('──────────────────────────────────────────');
  }
}
