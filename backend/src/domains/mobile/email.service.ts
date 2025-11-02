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
      console.log(`📧 Looking for email template: ${templateType}`);
      const template = await this.prisma.emailTemplate.findUnique({
        where: { templateType },
      });

      if (!template) {
        console.error(`✗ Email template not found: ${templateType}`);
        throw new Error(`Email template not found: ${templateType}`);
      }

      if (!template.isActive) {
        console.error(`✗ Email template is inactive: ${templateType}`);
        throw new Error(`Email template is inactive: ${templateType}`);
      }

      console.log(`✓ Email template found and active: ${templateType}`);

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
    console.log(`📧 sendPasswordSetupEmail called for ${email}`);
    
    try {
      const setupUrl = `${this.appUrl}/agent/setup-password?token=${setupToken}`;
      console.log(`📧 Setup URL generated: ${setupUrl}`);

      console.log(`📧 Rendering email template 'password_setup'...`);
      const { subject, body } = await this.renderEmailTemplate('password_setup', {
        firstName,
        setupUrl,
        appUrl: this.appUrl,
      });
      console.log(`📧 Email template rendered successfully. Subject: ${subject}`);

      console.log(`📧 Sending email to ${email}...`);
      await this.sendEmail(email, subject, body);
      console.log(`✓ Email successfully sent to ${email}`);
    } catch (error: any) {
      console.error(`✗ Error in sendPasswordSetupEmail:`, {
        email,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
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
        console.error('✗ No email configurations found in database. Please configure SMTP settings.');
        throw new Error(
          'Email configurations not found. Please configure SMTP settings.'
        );
      }
      
      console.log(`✓ Found ${configs.length} email configuration(s)`);

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

      const smtpSecureRaw = configMap.get('smtp_secure');
      const smtpSecure = smtpSecureRaw === 'true' || smtpSecureRaw === '1';
      const smtpPort = parseInt(configMap.get('smtp_port') || '587');
      
      console.log(`📧 SMTP Configuration:`, {
        host: configMap.get('smtp_host'),
        port: smtpPort,
        secure: smtpSecure,
        secureRaw: smtpSecureRaw,
        username: configMap.get('smtp_username'),
        from: configMap.get('email_from_address'),
      });

      const emailConfig: EmailConfig = {
        smtpHost: configMap.get('smtp_host') || 'localhost',
        smtpPort,
        smtpSecure,
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
      // For Gmail on port 465, we need secure: true
      // For Gmail on port 587, we need secure: false and requireTLS: true
      const transportOptions: any = {
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure, // true for port 465 (SSL), false for port 587 (TLS)
        auth: {
          user: config.smtpUsername,
          pass: config.smtpPassword,
        },
        connectionTimeout: config.emailTimeout * 1000,
      };

      // For port 587 with TLS, we need requireTLS even if secure is false
      if (config.smtpPort === 587 && !config.smtpSecure) {
        transportOptions.requireTLS = true;
      }

      this.transporter = nodemailer.createTransport(transportOptions);

      // Verify connection
      try {
        console.log(`📧 Verifying SMTP connection to ${config.smtpHost}:${config.smtpPort}...`);
        await this.transporter.verify();
        console.log('✓ SMTP connection verified successfully');
      } catch (error: any) {
        console.error('✗ SMTP connection verification failed:', {
          host: config.smtpHost,
          port: config.smtpPort,
          error: error.message,
        });
        this.transporter = null;
        throw new Error(`Failed to connect to SMTP server: ${error.message}`);
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
