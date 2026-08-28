import { Injectable, Logger } from '@nestjs/common';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly isProduction: boolean;
  private readonly brevoApiKey = process.env.BREVO_API_KEY || '';
  private transport: any = null;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';

    if (this.isProduction) {
      const config: SmtpConfig = {
        // Prefer the Brevo SMTP relay; fall back to generic SMTP_* vars.
        host: process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: parseInt(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || '587', 10),
        user: process.env.BREVO_SMTP_USER || process.env.SMTP_USER || '',
        pass: process.env.BREVO_SMTP_PASS || process.env.SMTP_PASS || '',
        from: process.env.BREVO_FROM || process.env.SMTP_FROM || 'noreply@greyauction.com',
      };

      if (config.host && config.user) {
        this.initTransport(config);
      } else {
        this.logger.warn('SMTP not configured. Emails will be logged to console.');
      }
    }
  }

  private async initTransport(config: SmtpConfig): Promise<void> {
    try {
      const nodemailer = await import('nodemailer');
      this.transport = nodemailer.default.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });
      this.logger.log('SMTP transport initialized');
    } catch (error) {
      this.logger.warn('Nodemailer not available. Emails will be logged to console.');
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      // Prefer Brevo as the mail service when an API key is configured.
      if (this.brevoApiKey) {
        await this.sendViaBrevoApi(options);
        return;
      }
      if (!this.isProduction || !this.transport) {
        this.logEmail(options);
        return;
      }

      const config: SmtpConfig = {
        host: process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: parseInt(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || '587', 10),
        user: process.env.BREVO_SMTP_USER || process.env.SMTP_USER || '',
        pass: process.env.BREVO_SMTP_PASS || process.env.SMTP_PASS || '',
        from: process.env.BREVO_FROM || process.env.SMTP_FROM || 'noreply@greyauction.com',
      };

      await this.transport.sendMail({
        from: `"GreyAuction" <${config.from}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`);
      this.logEmail(options);
    }
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    const subject = 'Reset Your GreyAuction Password';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">GreyAuction</h1>
        </div>
        <div style="padding: 30px; background: #ffffff; border: 1px solid #e0e0e0;">
          <h2 style="color: #1a1a2e;">Password Reset Request</h2>
          <p style="color: #333; line-height: 1.6;">
            You requested a password reset. Click the button below to reset your password.
            This link expires in 1 hour.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}"
               style="background: #e94560; color: #ffffff; padding: 12px 30px;
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const subject = 'Your GreyAuction Verification Code';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">GreyAuction</h1>
        </div>
        <div style="padding: 30px; background: #ffffff; border: 1px solid #e0e0e0;">
          <h2 style="color: #1a1a2e;">Email Verification</h2>
          <p style="color: #333; line-height: 1.6;">
            Use the code below to verify your email address. This code expires in 10 minutes.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px;
                         color: #1a1a2e; background: #f0f0f0; padding: 15px 30px;
                         border-radius: 8px; display: inline-block;">
              ${otp}
            </span>
          </div>
          <p style="color: #666; font-size: 12px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const subject = 'Welcome to GreyAuction!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">GreyAuction</h1>
        </div>
        <div style="padding: 30px; background: #ffffff; border: 1px solid #e0e0e0;">
          <h2 style="color: #1a1a2e;">Welcome, ${name}!</h2>
          <p style="color: #333; line-height: 1.6;">
            Thank you for joining GreyAuction, the premier auction marketplace.
            Start bidding on exclusive items or become a seller to list your own.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard"
               style="background: #e94560; color: #ffffff; padding: 12px 30px;
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">
            Happy bidding! The GreyAuction Team
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendSellerVerificationEmail(
    to: string,
    businessName: string,
    status: 'approved' | 'rejected',
    reason?: string,
  ): Promise<void> {
    const isApproved = status === 'approved';
    const subject = isApproved
      ? 'Your Seller Account Has Been Approved!'
      : 'Update on Your Seller Verification';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">GreyAuction</h1>
        </div>
        <div style="padding: 30px; background: #ffffff; border: 1px solid #e0e0e0;">
          <h2 style="color: #1a1a2e;">
            ${isApproved ? 'Congratulations!' : 'Verification Update'}
          </h2>
          <p style="color: #333; line-height: 1.6;">
            ${isApproved
              ? `Great news! Your seller account <strong>${businessName}</strong> has been approved. You can now start listing products on GreyAuction.`
              : `Your seller account <strong>${businessName}</strong> was not approved at this time.`
            }
          </p>
          ${!isApproved && reason ? `
            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px;
                        border-radius: 5px; margin: 20px 0;">
              <strong>Reason:</strong> ${reason}
            </div>
          ` : ''}
          ${isApproved ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/seller/dashboard"
                 style="background: #e94560; color: #ffffff; padding: 12px 30px;
                        text-decoration: none; border-radius: 5px; font-weight: bold;">
                Go to Seller Dashboard
              </a>
            </div>
          ` : `
            <p style="color: #333; line-height: 1.6;">
              You can update your information and reapply for verification.
            </p>
          `}
        </div>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendRoomInviteEmail(
    to: string,
    data: {
      inviterName: string;
      roomName: string;
      inviteLink: string;
      startTime: Date;
      expiresAt: Date;
      isPrivate: boolean;
    },
  ): Promise<void> {
    const subject = `${data.inviterName} invited you to a ${
      data.isPrivate ? 'private' : ''
    } auction — ${data.roomName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a2e; padding: 24px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">GreyAuction</h1>
          <p style="color: #ffffff; margin: 8px 0 0; font-size: 14px;">
            ${
              data.isPrivate
                ? '🔒 Exclusive Private Auction Invitation'
                : 'You\u2019ve been invited to an auction'
            }
          </p>
        </div>
        <div style="padding: 30px; background: #ffffff; border: 1px solid #e0e0e0;">
          <h2 style="color: #1a1a2e;">You're Invited!</h2>
          <p style="color: #333; line-height: 1.6;">
            <strong>${data.inviterName}</strong> has personally invited you to
            participate in <strong>${data.roomName}</strong>.
          </p>
          <p style="color: #333; line-height: 1.6;">
            Auction starts: <strong>${data.startTime.toLocaleString()}</strong>
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.inviteLink}"
               style="background: #e94560; color: #ffffff; padding: 14px 36px;
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #666; font-size: 12px; text-align: center;">
            This invitation expires on ${data.expiresAt.toLocaleString()}
          </p>
        </div>
        <div style="padding: 20px; text-align: center; background: #f8f8f8;">
          <p style="color: #999; font-size: 11px; margin: 0;">
            GreyAuction — Bid smart, buy better.
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendOrganizationRegistrationEmail(
    to: string,
    data: {
      agencyName: string;
      agencyType: string;
      contactPerson: string;
    },
  ): Promise<void> {
    const subject = `Welcome to GreyAuction — ${data.agencyName} registration received`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a2e; padding: 24px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">GreyAuction</h1>
          <p style="color: #ffffff; margin: 8px 0 0; font-size: 14px;">
            Organization Auction Registration
          </p>
        </div>
        <div style="padding: 30px; background: #ffffff; border: 1px solid #e0e0e0;">
          <h2 style="color: #1a1a2e;">Registration Received</h2>
          <p style="color: #333; line-height: 1.6;">
            Thank you for registering <strong>${data.agencyName}</strong>
            (${data.agencyType}) with GreyAuction.
          </p>
          <p style="color: #333; line-height: 1.6;">
            Our team will reach out to <strong>${data.contactPerson}</strong> to confirm
            your registration and discuss your auction requirements.
          </p>
          <div style="background: #f0f7ff; border: 1px solid #cce5ff; padding: 15px;
                      border-radius: 5px; margin: 20px 0;">
            <strong>Next steps:</strong>
            <ol style="margin: 10px 0 0; padding-left: 20px; color: #333;">
              <li>Our team will contact you to verify your organization</li>
              <li>Once confirmed, you can list items for auction</li>
              <li>You may also request our free consultant listing service</li>
            </ol>
          </div>
          <p style="color: #666; font-size: 12px;">
            Questions? Reply to this email or contact our support team.
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendInvoiceEmail(
    to: string,
    data: {
      invoiceNumber: string;
      total: number;
      pdfUrl: string;
      itemTitle: string;
    },
  ): Promise<void> {
    const subject = `Your GreyAuction Invoice ${data.invoiceNumber}`;
    const total = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(data.total);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">GreyAuction</h1>
        </div>
        <div style="padding: 30px; background: #ffffff; border: 1px solid #e0e0e0;">
          <h2 style="color: #1a1a2e;">Invoice ${data.invoiceNumber}</h2>
          <p style="color: #333; line-height: 1.6;">
            Congratulations on winning <strong>${data.itemTitle}</strong>! Please find your
            invoice details below.
          </p>
          <div style="background: #f0f7ff; border: 1px solid #cce5ff; padding: 15px;
                      border-radius: 5px; margin: 20px 0; text-align: center;">
            <strong style="font-size: 20px; color: #1a1a2e;">${total}</strong>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.pdfUrl}"
               style="background: #e94560; color: #ffffff; padding: 12px 30px;
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
              Download Invoice
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">
            Please complete payment to finalize your purchase. Contact support for assistance.
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendReceiptEmail(
    to: string,
    data: {
      invoiceNumber: string;
      total: number;
      paymentMethod: string;
    },
  ): Promise<void> {
    const subject = `Payment Received — Invoice ${data.invoiceNumber}`;
    const total = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(data.total);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">GreyAuction</h1>
        </div>
        <div style="padding: 30px; background: #ffffff; border: 1px solid #e0e0e0;">
          <h2 style="color: #1a1a2e;">Payment Received</h2>
          <p style="color: #333; line-height: 1.6;">
            We've received your payment for invoice
            <strong>${data.invoiceNumber}</strong>. Thank you!
          </p>
          <div style="background: #f0f7ff; border: 1px solid #cce5ff; padding: 15px;
                      border-radius: 5px; margin: 20px 0; text-align: center;">
            <strong style="font-size: 20px; color: #1a1a2e;">${total}</strong>
            <p style="margin: 8px 0 0; color: #666; font-size: 13px;">
              Paid via ${data.paymentMethod}
            </p>
          </div>
          <p style="color: #666; font-size: 12px;">
            Your item will be released shortly. The GreyAuction Team
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }

  private async sendViaBrevoApi(options: SendEmailOptions): Promise<void> {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': this.brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          email: process.env.BREVO_FROM || process.env.SMTP_FROM || 'noreply@greyauction.com',
          name: 'GreyAuction',
        },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      throw new Error('Brevo ' + res.status + ': ' + text);
    }
    this.logger.log('Email sent to ' + options.to + ' via Brevo: ' + options.subject);
  }

  private logEmail(options: SendEmailOptions): void {
    this.logger.log('──────────────────────────────────────────');
    this.logger.log(`📧 EMAIL (${this.isProduction ? 'PROD-FALLBACK' : 'DEV'})`);
    this.logger.log(`   To:      ${options.to}`);
    this.logger.log(`   Subject: ${options.subject}`);
    this.logger.log('─── HTML Body ─────────────────────────────');
    this.logger.log(options.html);
    this.logger.log('──────────────────────────────────────────');
  }
}
