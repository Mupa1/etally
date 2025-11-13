import africastalking from 'africastalking';
import PrismaService from '@/infrastructure/database/prisma.service';
import { decrypt, isEncrypted } from '@/shared/utils/encryption.util';

type SmsProvider = 'africastalking';

interface SmsConfig {
  provider: SmsProvider;
  username: string;
  apiKey: string;
  senderId?: string;
  maskedNumber?: string;
  telco?: string;
  maxRetry: number;
  timeoutSeconds: number;
  apiBaseUrl: string;
  bulkEndpoint: string;
}

interface SmsSendResult {
  provider: SmsProvider;
  recipients: string[];
  message: string;
  attempt: number;
  sentAt: string;
  providerResponse?: any;
}

export class SmsService {
  private prisma: PrismaService;
  private configCache: SmsConfig | null = null;
  private configCacheExpiry = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.prisma = PrismaService.getInstance();
  }

  private async getSmsConfig(): Promise<SmsConfig> {
    if (this.configCache && Date.now() < this.configCacheExpiry) {
      return this.configCache;
    }

    try {
      const configs = await this.prisma.configuration.findMany({
        where: {
          category: 'sms',
        },
      });

      if (configs.length === 0) {
        console.error(
          '✗ No SMS configurations found in database. Please configure SMS settings.'
        );
        throw new Error(
          'SMS configurations not found. Please configure SMS settings.'
        );
      }

      const configMap = new Map(configs.map((c) => [c.key, c.value]));

      let apiKey = configMap.get('africastalking_api_key') || '';
      if (apiKey && isEncrypted(apiKey)) {
        try {
          apiKey = decrypt(apiKey);
        } catch (error) {
          console.error('Failed to decrypt Africa\'s Talking API key:', error);
          throw new Error('Failed to decrypt Africa\'s Talking API key');
        }
      }

      const providerRaw = (configMap.get('sms_provider') || 'africastalking').toLowerCase();
      const provider: SmsProvider = providerRaw === 'africastalking' ? 'africastalking' : 'africastalking';

      const timeout = parseInt(configMap.get('sms_timeout') || '30', 10);
      const maxRetry = parseInt(configMap.get('sms_max_retry') || '3', 10);
      const apiBaseUrl =
        configMap.get('africastalking_base_url') || 'https://api.africastalking.com';
      const bulkEndpoint =
        configMap.get('africastalking_bulk_endpoint') ||
        '/version1/messaging/bulk';

      const smsConfig: SmsConfig = {
        provider,
        username: configMap.get('africastalking_username') || '',
        apiKey,
        senderId: configMap.get('africastalking_sender_id') || undefined,
        maskedNumber: configMap.get('africastalking_masked_number') || undefined,
        telco: configMap.get('africastalking_telco') || undefined,
        maxRetry: Number.isFinite(maxRetry) ? maxRetry : 3,
        timeoutSeconds: Number.isFinite(timeout) ? timeout : 30,
        apiBaseUrl,
        bulkEndpoint,
      };

      if (!smsConfig.username || !smsConfig.apiKey) {
        throw new Error(
          'SMS configuration is incomplete. Please provide Africa\'s Talking username and API key.'
        );
      }

      this.configCache = smsConfig;
      this.configCacheExpiry = Date.now() + this.CACHE_TTL;

      return smsConfig;
    } catch (error) {
      console.error('Failed to fetch SMS configuration:', error);
      throw new Error('SMS service configuration error');
    }
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    return phoneNumber.trim();
  }

  private async sendWithAfricasTalking(
    config: SmsConfig,
    recipients: string[],
    message: string
  ): Promise<any> {
    const phoneNumbers = recipients
      .map(this.normalizePhoneNumber)
      .filter(Boolean);

    if (phoneNumbers.length === 0) {
      throw new Error('No valid phone numbers provided for SMS delivery.');
    }

    const client = africastalking({
      username: config.username,
      apiKey: config.apiKey,
    });

    const payload: Record<string, any> = {
      to: phoneNumbers,
      message,
    };

    if (config.senderId || config.maskedNumber) {
      payload.from = config.senderId || config.maskedNumber;
    }

    if (config.telco) {
      payload.keyword = config.telco;
    }

    try {
      return await client.SMS.send(payload);
    } catch (error: any) {
      throw new Error(
        error?.message ||
          "Africa's Talking SDK reported an error while sending SMS."
      );
    }
  }

  private async sendSms(
    recipients: string[],
    message: string
  ): Promise<SmsSendResult> {
    const config = await this.getSmsConfig();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.maxRetry; attempt++) {
      try {
        const providerResponse = await this.sendWithAfricasTalking(
          config,
          recipients,
          message
        );

        console.log(`✓ SMS sent successfully to ${recipients.join(', ')}`);

        return {
          provider: config.provider,
          recipients,
          message,
          attempt,
          sentAt: new Date().toISOString(),
          providerResponse,
        };
      } catch (error: any) {
        lastError = error;
        console.error(
          `✗ SMS send attempt ${attempt} failed:`,
          error?.message || error
        );

        if (attempt < config.maxRetry) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Failed to send SMS after ${config.maxRetry} attempts: ${lastError?.message}`
    );
  }

  async sendRegistrationConfirmation(
    phoneNumber: string,
    firstName: string,
    trackingNumber: string
  ): Promise<SmsSendResult> {
    const message = `Hi ${firstName}, your observer application has been received. Your tracking number is ${trackingNumber}. We will notify you via SMS once it is reviewed.`;
    return this.sendSms([phoneNumber], message);
  }

  async sendPasswordSetupSms(
    phoneNumber: string,
    firstName: string,
    setupToken: string
  ): Promise<SmsSendResult> {
    const appUrl = process.env.APP_URL || 'https://observer.etally.ke';
    const setupUrl = `${appUrl.replace(/\/$/, '')}/agent/setup-password?token=${setupToken}`;
    const message = `Hi ${firstName}, your observer account is ready. Set your password here: ${setupUrl}`;
    return this.sendSms([phoneNumber], message);
  }

  async sendWelcomeSms(
    phoneNumber: string,
    firstName: string
  ): Promise<SmsSendResult> {
    const appUrl = process.env.APP_URL || 'https://observer.etally.ke';
    const loginUrl = `${appUrl.replace(/\/$/, '')}/agent/login`;
    const message = `Hi ${firstName}, welcome aboard! You can now sign in to the observer portal: ${loginUrl}`;
    return this.sendSms([phoneNumber], message);
  }

  async sendRejectionSms(
    phoneNumber: string,
    firstName: string,
    rejectionReason: string
  ): Promise<SmsSendResult> {
    const message = `Hi ${firstName}, unfortunately your observer application was not approved. Reason: ${rejectionReason}`;
    return this.sendSms([phoneNumber], message);
  }

  async sendClarificationRequestSms(
    phoneNumber: string,
    firstName: string,
    notes: string,
    trackingNumber?: string,
    trackingUrl?: string
  ): Promise<SmsSendResult> {
    const appUrl = process.env.APP_URL || 'https://observer.etally.ke';
    const base = `Hi ${firstName}, we need more info for your observer application. ${notes}`;
    const trackingPart = trackingNumber
      ? ` Tracking number: ${trackingNumber}.`
      : '';
    const finalTrackingUrl =
      trackingUrl ||
      (trackingNumber
        ? `${appUrl.replace(/\/$/, '')}/agent/track/${trackingNumber}`
        : undefined);
    const urlPart = finalTrackingUrl ? ` Update here: ${finalTrackingUrl}` : '';
    const message = `${base}${trackingPart}${urlPart}`;
    return this.sendSms([phoneNumber], message);
  }

  async sendTestSms(
    phoneNumber: string,
    message?: string
  ): Promise<SmsSendResult> {
    const config = await this.getSmsConfig();
    const testMessage =
      message?.trim() ||
      'This is a diagnostic SMS from eTally to confirm that your SMS configuration is working correctly.';

    console.log('📱 Sending test SMS using provider:', config.provider);
    return this.sendSms([phoneNumber], testMessage);
  }

  invalidateCache(): void {
    this.configCache = null;
    this.configCacheExpiry = 0;
  }
}

