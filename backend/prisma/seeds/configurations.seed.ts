/**
 * Configuration Seed Data
 * Default system configurations including email service settings
 */

import { PrismaClient, ConfigurationType } from '@prisma/client';

const prisma = new PrismaClient();

const defaultConfigurations = [
  // General Settings
  {
    key: 'app_name',
    name: 'Application Name',
    description: 'The name of the application displayed to users',
    value: 'eTally Election Management System',
    type: ConfigurationType.string,
    category: 'general',
    isRequired: true,
    isDefault: false,
  },
  {
    key: 'maintenance_mode',
    name: 'Maintenance Mode',
    description: 'Enable maintenance mode to prevent user access',
    value: 'false',
    type: ConfigurationType.boolean,
    category: 'general',
    isRequired: true,
    isDefault: false,
  },

  // Security Settings
  {
    key: 'max_login_attempts',
    name: 'Maximum Login Attempts',
    description: 'Number of failed login attempts before account lockout',
    value: '5',
    type: ConfigurationType.number,
    category: 'security',
    isRequired: true,
    isDefault: false,
  },
  {
    key: 'session_timeout',
    name: 'Session Timeout',
    description: 'Session timeout in minutes',
    value: '30',
    type: ConfigurationType.number,
    category: 'security',
    isRequired: true,
    isDefault: true,
  },
  {
    key: 'password_min_length',
    name: 'Minimum Password Length',
    description: 'Minimum length required for passwords',
    value: '8',
    type: ConfigurationType.number,
    category: 'security',
    isRequired: true,
    isDefault: true,
  },

  // Email Service Settings
  {
    key: 'smtp_host',
    name: 'SMTP Host',
    description: 'SMTP server hostname or IP address',
    value: 'smtp.gmail.com',
    type: ConfigurationType.string,
    category: 'email',
    isRequired: true,
    isDefault: false,
  },
  {
    key: 'smtp_port',
    name: 'SMTP Port',
    description:
      'SMTP server port number (587 for TLS, 465 for SSL, 25 for non-secure)',
    value: '587',
    type: ConfigurationType.number,
    category: 'email',
    isRequired: true,
    isDefault: false,
  },
  {
    key: 'smtp_secure',
    name: 'SMTP Secure Connection',
    description: 'Use TLS/SSL for secure email transmission',
    value: 'true',
    type: ConfigurationType.boolean,
    category: 'email',
    isRequired: true,
    isDefault: false,
  },
  {
    key: 'smtp_username',
    name: 'SMTP Username',
    description: 'Username for SMTP authentication',
    value: 'noreply@etally.com',
    type: ConfigurationType.string,
    category: 'email',
    isRequired: true,
    isDefault: false,
  },
  {
    key: 'smtp_password',
    name: 'SMTP Password',
    description: 'Password for SMTP authentication (stored encrypted)',
    value: '',
    type: ConfigurationType.string,
    category: 'email',
    isRequired: true,
    isDefault: false,
  },
  {
    key: 'email_from_address',
    name: 'From Email Address',
    description: 'Default sender email address for outgoing emails',
    value: 'noreply@etally.com',
    type: ConfigurationType.string,
    category: 'email',
    isRequired: true,
    isDefault: false,
  },
  {
    key: 'email_from_name',
    name: 'From Name',
    description: 'Display name for outgoing emails',
    value: 'eTally Election System',
    type: ConfigurationType.string,
    category: 'email',
    isRequired: true,
    isDefault: false,
  },
  {
    key: 'email_reply_to',
    name: 'Reply-To Address',
    description: 'Email address for replies (optional)',
    value: 'support@etally.com',
    type: ConfigurationType.string,
    category: 'email',
    isRequired: false,
    isDefault: false,
  },
  {
    key: 'email_max_retry',
    name: 'Maximum Retry Attempts',
    description: 'Number of times to retry sending failed emails',
    value: '3',
    type: ConfigurationType.number,
    category: 'email',
    isRequired: true,
    isDefault: true,
  },
  {
    key: 'email_timeout',
    name: 'Connection Timeout',
    description: 'SMTP connection timeout in seconds',
    value: '30',
    type: ConfigurationType.number,
    category: 'email',
    isRequired: true,
    isDefault: true,
  },

  // Notification Settings
  {
    key: 'email_notifications_enabled',
    name: 'Email Notifications',
    description: 'Enable email notifications for system events',
    value: 'true',
    type: ConfigurationType.boolean,
    category: 'notifications',
    isRequired: false,
    isDefault: false,
  },
  {
    key: 'notification_batch_size',
    name: 'Notification Batch Size',
    description: 'Number of notifications to send in each batch',
    value: '50',
    type: ConfigurationType.number,
    category: 'notifications',
    isRequired: true,
    isDefault: true,
  },

  // Rate Limiting Settings
  {
    key: 'api_rate_limit',
    name: 'API Rate Limit',
    description: 'Maximum API requests per minute per user',
    value: '100',
    type: ConfigurationType.number,
    category: 'rate-limiting',
    isRequired: true,
    isDefault: false,
  },
  {
    key: 'rate_limit_window',
    name: 'Rate Limit Window',
    description: 'Time window for rate limiting in minutes',
    value: '1',
    type: ConfigurationType.number,
    category: 'rate-limiting',
    isRequired: true,
    isDefault: true,
  },

  // Storage Settings
  {
    key: 'max_file_size',
    name: 'Maximum File Size',
    description: 'Maximum file upload size in MB',
    value: '10',
    type: ConfigurationType.number,
    category: 'storage',
    isRequired: true,
    isDefault: false,
  },
  {
    key: 'allowed_file_types',
    name: 'Allowed File Types',
    description: 'Comma-separated list of allowed file extensions',
    value: 'jpg,jpeg,png,pdf,doc,docx',
    type: ConfigurationType.string,
    category: 'storage',
    isRequired: true,
    isDefault: true,
  },

  // Database Settings
  {
    key: 'db_pool_size',
    name: 'Database Pool Size',
    description: 'Maximum number of database connections',
    value: '20',
    type: ConfigurationType.number,
    category: 'database',
    isRequired: true,
    isDefault: true,
  },
  {
    key: 'db_query_timeout',
    name: 'Query Timeout',
    description: 'Database query timeout in seconds',
    value: '30',
    type: ConfigurationType.number,
    category: 'database',
    isRequired: true,
    isDefault: true,
  },
];

export async function seedConfigurations() {
  console.log('🌱 Seeding configurations...');

  for (const config of defaultConfigurations) {
    try {
      await prisma.configuration.upsert({
        where: { key: config.key },
        update: {}, // Don't update if exists
        create: config,
      });
      console.log(`  ✓ Configuration: ${config.key}`);
    } catch (error) {
      console.error(`  ✗ Failed to seed ${config.key}:`, error);
    }
  }

  console.log('✅ Configuration seeding completed');
}

// Auto-run when executed
seedConfigurations()
  .catch((e) => {
    console.error('Error seeding configurations:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
