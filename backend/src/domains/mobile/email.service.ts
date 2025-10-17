/**
 * Email Service for Observer Notifications
 * Uses SMTP configurations from database
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import PrismaService from '@/infrastructure/database/prisma.service';

interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUsername: string;
  smtpPassword: string;
  emailFromAddress: string;
  emailFromName: string;
  emailReplyTo?: string;
  emailMaxRetry: number;
  emailTimeout: number;
}

export class EmailService {
  private readonly appUrl = process.env.APP_URL || 'http://localhost:5173';
  private prisma: PrismaService;
  private transporter: Transporter | null = null;
  private configCache: EmailConfig | null = null;
  private configCacheExpiry: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.prisma = PrismaService.getInstance();
  }

  /**
   * Send registration confirmation email
   */
  async sendRegistrationConfirmation(
    email: string,
    firstName: string,
    trackingNumber: string
  ): Promise<void> {
    const subject = 'Observer Registration Received';
    const html = `
      <h2>Hello ${firstName},</h2>
      <p>Thank you for registering as a field observer.</p>
      <p>Your application has been received and is currently under review.</p>
      
      <p><strong>Application Tracking Number:</strong> ${trackingNumber}</p>
      <p>You can track your application status at:</p>
      <p><a href="${this.appUrl}/mobile/track/${trackingNumber}">Track Application</a></p>
      
      <p>You will receive another email when your application is reviewed (typically within 24-48 hours).</p>
      
      <p>Best regards,<br>Election Management Team</p>
    `;

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send password setup email
   */
  async sendPasswordSetupEmail(
    email: string,
    firstName: string,
    setupToken: string
  ): Promise<void> {
    const subject = 'Observer Application Approved - Set Your Password';
    const setupUrl = `${this.appUrl}/mobile/setup-password?token=${setupToken}`;

    const html = `
      <h2>Congratulations ${firstName}!</h2>
      <p>Your observer application has been approved.</p>
      
      <p>To complete your registration, please set up your password by clicking the link below:</p>
      <p><a href="${setupUrl}">Set Up Password</a></p>
      
      <p><strong>Important:</strong> This link will expire in 48 hours.</p>
      
      <p>After setting your password, you can login to the observer portal and start submitting election results.</p>
      
      <p>Best regards,<br>Election Management Team</p>
    `;

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send welcome email after password setup
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const subject = 'Welcome to Field Observer Portal';
    const loginUrl = `${this.appUrl}/mobile/login`;

    const html = `
      <h2>Welcome ${firstName}!</h2>
      <p>Your field observer account is now active.</p>
      
      <p>You can now login to the observer portal:</p>
      <p><a href="${loginUrl}">Login to Observer Portal</a></p>
      
      <p>Once logged in, you will:</p>
      <ul>
        <li>See your assigned polling stations</li>
        <li>Submit election results</li>
        <li>Upload Form 34A photos</li>
        <li>Track your submissions</li>
      </ul>
      
      <p>The mobile app works offline, so you can submit results even without internet connection.</p>
      
      <p>Best regards,<br>Election Management Team</p>
    `;

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send rejection email
   */
  async sendRejectionEmail(
    email: string,
    firstName: string,
    rejectionReason: string
  ): Promise<void> {
    const subject = 'Observer Application Status Update';

    const html = `
      <h2>Hello ${firstName},</h2>
      <p>Thank you for your interest in becoming a field observer.</p>
      
      <p>After careful review, we are unable to approve your application at this time.</p>
      
      <p><strong>Reason:</strong> ${rejectionReason}</p>
      
      <p>If you believe this is an error or have questions, please contact our support team.</p>
      
      <p>Best regards,<br>Election Management Team</p>
    `;

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send clarification request email
   */
  async sendClarificationRequest(
    email: string,
    firstName: string,
    notes: string
  ): Promise<void> {
    const subject = 'Observer Application - Additional Information Required';

    const html = `
      <h2>Hello ${firstName},</h2>
      <p>We are reviewing your observer application and need some clarification:</p>
      
      <p><strong>Notes:</strong></p>
      <p>${notes}</p>
      
      <p>Please contact our support team to provide the requested information.</p>
      
      <p>Best regards,<br>Election Management Team</p>
    `;

    await this.sendEmail(email, subject, html);
  }

  /**
   * Fetch email configuration from database
   */
  private async getEmailConfig(): Promise<EmailConfig> {
    // Check cache
    if (this.configCache && Date.now() < this.configCacheExpiry) {
      return this.configCache;
    }

    try {
      // Fetch all email configurations
      const configs = await this.prisma.configuration.findMany({
        where: {
          category: 'email',
        },
      });

      if (configs.length === 0) {
        throw new Error(
          'Email configurations not found. Please configure SMTP settings.'
        );
      }

      // Parse configurations
      const configMap = new Map(configs.map((c) => [c.key, c.value]));

      const emailConfig: EmailConfig = {
        smtpHost: configMap.get('smtp_host') || 'localhost',
        smtpPort: parseInt(configMap.get('smtp_port') || '587'),
        smtpSecure: configMap.get('smtp_secure') === 'true',
        smtpUsername: configMap.get('smtp_username') || '',
        smtpPassword: configMap.get('smtp_password') || '',
        emailFromAddress:
          configMap.get('email_from_address') || 'noreply@etally.com',
        emailFromName:
          configMap.get('email_from_name') || 'eTally Election System',
        emailReplyTo: configMap.get('email_reply_to') || undefined,
        emailMaxRetry: parseInt(configMap.get('email_max_retry') || '3'),
        emailTimeout: parseInt(configMap.get('email_timeout') || '30'),
      };

      // Cache the configuration
      this.configCache = emailConfig;
      this.configCacheExpiry = Date.now() + this.CACHE_TTL;

      return emailConfig;
    } catch (error) {
      console.error('Failed to fetch email configuration:', error);
      throw new Error('Email service configuration error');
    }
  }

  /**
   * Get or create email transporter
   */
  private async getTransporter(): Promise<Transporter> {
    const config = await this.getEmailConfig();

    // Create new transporter if configuration changed
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: {
          user: config.smtpUsername,
          pass: config.smtpPassword,
        },
        connectionTimeout: config.emailTimeout * 1000,
      });

      // Verify connection
      try {
        await this.transporter.verify();
        console.log('✓ SMTP connection verified');
      } catch (error) {
        console.error('SMTP connection failed:', error);
        this.transporter = null;
        throw new Error('Failed to connect to SMTP server');
      }
    }

    if (!this.transporter) {
      throw new Error('Failed to create email transporter');
    }

    return this.transporter;
  }

  /**
   * Base email sending function with retry logic
   */
  private async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<void> {
    const config = await this.getEmailConfig();
    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 1; attempt <= config.emailMaxRetry; attempt++) {
      try {
        const transporter = await this.getTransporter();

        const mailOptions = {
          from: `"${config.emailFromName}" <${config.emailFromAddress}>`,
          to,
          subject,
          html,
          replyTo: config.emailReplyTo,
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(`✓ Email sent successfully to ${to}`);
        console.log(`  Message ID: ${info.messageId}`);

        return; // Success
      } catch (error: any) {
        lastError = error;
        console.error(`✗ Email send attempt ${attempt} failed:`, error.message);

        // Reset transporter on connection errors
        if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
          this.transporter = null;
        }

        // Wait before retry (exponential backoff)
        if (attempt < config.emailMaxRetry) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw new Error(
      `Failed to send email after ${config.emailMaxRetry} attempts: ${lastError?.message}`
    );
  }

  /**
   * Invalidate configuration cache (call when configs are updated)
   */
  invalidateCache(): void {
    this.configCache = null;
    this.configCacheExpiry = 0;
    this.transporter = null;
  }
}
