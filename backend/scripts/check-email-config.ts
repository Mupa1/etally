/**
 * Script to check SMS configuration
 * Usage: npx ts-node scripts/check-email-config.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSmsConfig() {
  console.log('📱 Checking SMS configuration...\n');

  try {
    console.log('1. Checking SMS provider configuration...');
    const smsConfigs = await prisma.configuration.findMany({
      where: { category: 'sms' },
    });

    if (smsConfigs.length === 0) {
      console.log('   ✗ No SMS configurations found!');
      console.log(
        "   → Configure Africa's Talking credentials in the database"
      );
      console.log('   → Category: "sms"');
      console.log(
        '   → Required keys: africastalking_username, africastalking_api_key'
      );
    } else {
      console.log(`   ✓ Found ${smsConfigs.length} configuration(s)`);
      const configMap = new Map(smsConfigs.map((c) => [c.key, c.value]));
      const provider = (
        configMap.get('sms_provider') || 'africastalking'
      ).toLowerCase();
      console.log(`   ✓ sms_provider: ${provider}`);

      const requiredKeys = [
        'africastalking_username',
        'africastalking_api_key',
      ];
      const optionalKeys = [
        'africastalking_sender_id',
        'africastalking_masked_number',
        'africastalking_telco',
        'africastalking_base_url',
        'africastalking_bulk_endpoint',
        'sms_max_retry',
        'sms_timeout',
      ];

      let allConfigured = true;

      for (const key of requiredKeys) {
        const value = configMap.get(key);
        if (!value) {
          console.log(`   ✗ Missing: ${key}`);
          allConfigured = false;
        } else {
          const displayValue = key.includes('api_key') ? '***' : value;
          console.log(`   ✓ ${key}: ${displayValue}`);
        }
      }

      optionalKeys.forEach((key) => {
        const value = configMap.get(key);
        if (value) {
          const displayValue = key.includes('api_key') ? '***' : value;
          console.log(`   • ${key}: ${displayValue}`);
        }
      });

      if (!allConfigured) {
        console.log(
          '\n   ⚠ Some SMS configuration values are missing. SMS messages will not be sent.'
        );
      } else {
        console.log('\n   ✓ All required SMS settings are configured');
      }
    }

    console.log('\n2. Testing SMS service initialization...');
    try {
      const { SmsService } = await import('../src/domains/mobile/sms.service');
      const smsService = new SmsService();
      console.log('   ✓ SmsService can be instantiated');

      try {
        await (smsService as any).getSmsConfig();
        console.log('   ✓ SMS configuration can be loaded');
      } catch (error: any) {
        console.log(`   ⚠ Configuration error: ${error.message}`);
      }
    } catch (error: any) {
      console.log(`   ✗ Error: ${error.message}`);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSmsConfig();
