import PrismaService from '@/infrastructure/database/prisma.service';
import { decrypt, isEncrypted } from '@/shared/utils/encryption.util';

type SmsProvider = 'jambo';

interface SmsConfig {
  provider: SmsProvider;
  apiKey: string;
  partnerID: string;
  shortcode: string;
  maxRetry: number;
  timeoutSeconds: number;
  apiBaseUrl: string;
}

interface JamboSmsResponseItem {
  'respose-code'?: number;
  'response-code'?: number;
  'response-description'?: string;
  mobile?: number | string | null;
  messageid?: number;
  networkid?: string;
}

interface JamboSmsResponse {
  responses: JamboSmsResponseItem[];
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

      let apiKey = configMap.get('jambo_api_key') || '';
      if (apiKey && isEncrypted(apiKey)) {
        try {
          apiKey = decrypt(apiKey);
        } catch (error) {
          console.error('Failed to decrypt Jambo SMS API key:', error);
          throw new Error('Failed to decrypt Jambo SMS API key');
        }
      }

      const providerRaw = (
        configMap.get('sms_provider') || 'jambo'
      ).toLowerCase();
      const provider: SmsProvider = providerRaw === 'jambo' ? 'jambo' : 'jambo';

      const timeout = parseInt(configMap.get('sms_timeout') || '30', 10);
      const maxRetry = parseInt(configMap.get('sms_max_retry') || '3', 10);
      const apiBaseUrl =
        configMap.get('jambo_base_url') || 'https://smsgm.lemu.co.ke';

      const smsConfig: SmsConfig = {
        provider,
        apiKey,
        partnerID: configMap.get('jambo_partner_id') || '',
        shortcode: configMap.get('jambo_shortcode') || '',
        maxRetry: Number.isFinite(maxRetry) ? maxRetry : 3,
        timeoutSeconds: Number.isFinite(timeout) ? timeout : 30,
        apiBaseUrl,
      };

      if (!smsConfig.apiKey || !smsConfig.partnerID || !smsConfig.shortcode) {
        throw new Error(
          'SMS configuration is incomplete. Please provide Jambo SMS API key, Partner ID, and Shortcode.'
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
    // Remove + prefix if present, ensure it starts with country code
    let normalized = phoneNumber.trim().replace(/^\+/, '');

    // If it doesn't start with 254 (Kenya), assume it's missing the country code
    if (!normalized.startsWith('254')) {
      // If it starts with 0, replace with 254
      if (normalized.startsWith('0')) {
        normalized = '254' + normalized.substring(1);
      } else {
        // Assume it's a local number and prepend 254
        normalized = '254' + normalized;
      }
    }

    return normalized;
  }

  private async sendWithJambo(
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

    // Construct endpoint URL, handling trailing slashes
    const baseUrl = config.apiBaseUrl.replace(/\/$/, ''); // Remove trailing slash
    const endpoint = `${baseUrl}/api/services/sendsms/`;
    const results: any[] = [];

    // Jambo SMS API requires one request per phone number
    for (const mobile of phoneNumbers) {
      try {
        const payload = {
          apikey: config.apiKey,
          partnerID: config.partnerID,
          message: message,
          shortcode: config.shortcode,
          mobile: mobile,
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          config.timeoutSeconds * 1000
        );

        try {
          console.log(`📤 Sending SMS to Jambo API: ${endpoint}`);
          console.log(
            `📤 Payload (masked): { apikey: "***", partnerID: "${config.partnerID}", shortcode: "${config.shortcode}", mobile: "${mobile}", message: "${message.substring(0, 50)}..." }`
          );

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // Read response body as text first (can be parsed as JSON later if needed)
          const responseText = await response.text();

          if (!response.ok) {
            console.error(
              `❌ Jambo API error: ${response.status} ${response.statusText}`
            );
            if (responseText) {
              console.error(`❌ Response body: ${responseText}`);
            }
            throw new Error(
              `HTTP ${response.status}: ${response.statusText}${responseText ? ` - ${responseText.substring(0, 200)}` : ''}`
            );
          }

          // Parse response as JSON
          let responseData: JamboSmsResponse;
          try {
            responseData = JSON.parse(responseText) as JamboSmsResponse;
          } catch (parseError) {
            console.error(
              `❌ Failed to parse Jambo API response as JSON: ${responseText}`
            );
            throw new Error(
              `Invalid JSON response from Jambo API: ${responseText.substring(0, 200)}`
            );
          }

          // Check for Jambo SMS error responses
          if (responseData.responses && responseData.responses.length > 0) {
            const responseItem = responseData.responses[0];
            const responseCode =
              responseItem['respose-code'] || responseItem['response-code'];

            // Handle success (200)
            if (responseCode === 200) {
              results.push({
                success: true,
                mobile: responseItem.mobile,
                messageId: responseItem.messageid,
                networkId: responseItem.networkid,
                responseDescription: responseItem['response-description'],
              });
            } else {
              // Handle various error codes
              const errorDescription =
                responseItem['response-description'] || 'Unknown error';
              let errorMessage = errorDescription;

              switch (responseCode) {
                case 1001:
                  errorMessage = 'Invalid sender ID';
                  break;
                case 1002:
                  errorMessage = 'Network not allowed';
                  break;
                case 1004:
                  errorMessage = 'Invalid or unsupported mobile number';
                  break;
                case 1005:
                  errorMessage = 'System error';
                  break;
                case 1006:
                  errorMessage = 'Invalid credentials';
                  break;
                case 402:
                  errorMessage = `Low credit units: ${errorDescription}`;
                  break;
                case 4091:
                  errorMessage = 'No Partner ID is set';
                  break;
                case 4092:
                  errorMessage = 'No API KEY provided';
                  break;
                case 4093:
                  errorMessage = 'Details not found';
                  break;
              }

              results.push({
                success: false,
                mobile: responseItem.mobile || mobile,
                errorCode: responseCode,
                errorMessage: errorMessage,
              });
            }
          } else {
            throw new Error('Invalid response format from Jambo SMS API');
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error(
              `Request timeout after ${config.timeoutSeconds} seconds`
            );
          }
          throw fetchError;
        }
      } catch (error: any) {
        results.push({
          success: false,
          mobile: mobile,
          errorMessage: error?.message || 'Failed to send SMS',
        });
      }
    }

    // If all requests failed, throw an error
    const failedCount = results.filter((r) => !r.success).length;
    if (failedCount === results.length) {
      const firstError = results.find((r) => !r.success);
      throw new Error(
        firstError?.errorMessage || 'All SMS messages failed to send'
      );
    }

    // Return results in a consistent format
    return {
      results: results,
      successCount: results.filter((r) => r.success).length,
      failedCount: failedCount,
    };
  }

  private async sendSms(
    recipients: string[],
    message: string
  ): Promise<SmsSendResult> {
    const config = await this.getSmsConfig();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.maxRetry; attempt++) {
      try {
        const providerResponse = await this.sendWithJambo(
          config,
          recipients,
          message
        );

        const successCount = providerResponse.successCount || 0;
        if (successCount > 0) {
          console.log(
            `✓ SMS sent successfully to ${successCount} recipient(s)`
          );
        }

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
