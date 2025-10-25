/**
 * Email Service for Observer Notifications
 * Uses SMTP configurations from database and email templates
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import PrismaService from '@/infrastructure/database/prisma.service';
import { decrypt, isEncrypted } from '@/shared/utils/encryption.util';
import { EmailTemplateType } from '@prisma/client';

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
   * Get and render email template with variables
   */
  private async renderEmailTemplate(
    templateType: EmailTemplateType,
    variables: Record<string, string>
  ): Promise<{ subject: string; body: string }> {
    try {
      const template = await this.prisma.emailTemplate.findUnique({
        where: { templateType },
      });

      if (!template) {
        throw new Error(`Email template not found: ${templateType}`);
      }

      if (!template.isActive) {
        throw new Error(`Email template is inactive: ${templateType}`);
      }

      // Replace variables in subject and body
      let subject = template.subject;
      let body = template.body;

      // Replace all {{variable}} placeholders
      Object.keys(variables).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, variables[key]);
        body = body.replace(regex, variables[key]);
      });

      return { subject, body };
    } catch (error) {
      console.error(`Failed to render email template ${templateType}:`, error);
      throw error;
    }
  }

  /**
   * Send registration confirmation email
   */
  async sendRegistrationConfirmation(
    email: string,
    firstName: string,
    trackingNumber: string
  ): Promise<void> {
    const { subject, body } = await this.renderEmailTemplate(
      'registration_confirmation',
      {
        firstName,
        trackingNumber,
        appUrl: this.appUrl,
      }
    );

    await this.sendEmail(email, subject, body);
  }

  /**
   * Send password setup email
   */
  async sendPasswordSetupEmail(
    email: string,
    firstName: string,
    setupToken: string
  ): Promise<void> {
    const setupUrl = `${this.appUrl}/agent/setup-password?token=${setupToken}`;

    const { subject, body } = await this.renderEmailTemplate('password_setup', {
      firstName,
      setupUrl,
      appUrl: this.appUrl,
    });

    await this.sendEmail(email, subject, body);
  }

  /**
   * Send welcome email after password setup
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const loginUrl = `${this.appUrl}/agent/login`;

    const { subject, body } = await this.renderEmailTemplate('welcome', {
      firstName,
      loginUrl,
      appUrl: this.appUrl,
    });

    await this.sendEmail(email, subject, body);
  }

  /**
   * Send rejection email
   */
  async sendRejectionEmail(
    email: string,
    firstName: string,
    rejectionReason: string
  ): Promise<void> {
    const { subject, body } = await this.renderEmailTemplate('rejection', {
      firstName,
      rejectionReason,
      appUrl: this.appUrl,
    });

    await this.sendEmail(email, subject, body);
  }

  /**
   * Send clarification request email
   */
  async sendClarificationRequest(
    email: string,
    firstName: string,
    notes: string
  ): Promise<void> {
    const { subject, body } = await this.renderEmailTemplate(
      'clarification_request',
      {
        firstName,
        notes,
        appUrl: this.appUrl,
      }
    );

    await this.sendEmail(email, subject, body);
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

      // Get and decrypt SMTP password if encrypted
      let smtpPassword = configMap.get('smtp_password') || '';
      if (smtpPassword && isEncrypted(smtpPassword)) {
        try {
          smtpPassword = decrypt(smtpPassword);
        } catch (error) {
          console.error('Failed to decrypt SMTP password:', error);
          throw new Error('Failed to decrypt SMTP password');
        }
      }

      const emailConfig: EmailConfig = {
        smtpHost: configMap.get('smtp_host') || 'localhost',
        smtpPort: parseInt(configMap.get('smtp_port') || '587'),
        smtpSecure: configMap.get('smtp_secure') === 'true',
        smtpUsername: configMap.get('smtp_username') || '',
        smtpPassword,
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
