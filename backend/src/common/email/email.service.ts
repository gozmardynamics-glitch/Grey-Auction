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
  private transport: any = null;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';

    if (this.isProduction) {
      const config: SmtpConfig = {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || 'noreply@greyauction.com',
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
      if (!this.isProduction || !this.transport) {
        this.logEmail(options);
        return;
      }

      const config: SmtpConfig = {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || 'noreply@greyauction.com',
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
