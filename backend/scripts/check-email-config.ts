/**
 * Script to check email configuration and templates
 * Usage: npx ts-node scripts/check-email-config.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEmailConfig() {
  console.log('📧 Checking email configuration...\n');

  try {
    // Check email templates
    console.log('1. Checking email templates...');
    const templates = await prisma.emailTemplate.findMany({
      where: { templateType: 'password_setup' },
    });

    if (templates.length === 0) {
      console.log('   ✗ Password setup template not found!');
      console.log('   → Run: npm run prisma:seed (or seed email templates specifically)');
    } else {
      const template = templates[0];
      console.log(`   ✓ Template found: ${template.name}`);
      console.log(`   - Active: ${template.isActive ? 'Yes' : 'No (⚠ Template is inactive!)'}`);
      console.log(`   - Subject: ${template.subject}`);
    }

    console.log('\n2. Checking SMTP configuration...');
    const emailConfigs = await prisma.configuration.findMany({
      where: { category: 'email' },
    });

    if (emailConfigs.length === 0) {
      console.log('   ✗ No email configurations found!');
      console.log('   → You need to configure SMTP settings in the database');
      console.log('   → Category: "email"');
      console.log('   → Required keys: smtp_host, smtp_port, smtp_username, smtp_password, email_from_address, email_from_name');
    } else {
      console.log(`   ✓ Found ${emailConfigs.length} configuration(s)`);
      const configMap = new Map(emailConfigs.map((c) => [c.key, c.value]));
      
      const requiredKeys = ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'email_from_address', 'email_from_name'];
      let allConfigured = true;
      
      for (const key of requiredKeys) {
        const value = configMap.get(key);
        if (!value) {
          console.log(`   ✗ Missing: ${key}`);
          allConfigured = false;
        } else {
          const displayValue = key.includes('password') ? '***' : value;
          console.log(`   ✓ ${key}: ${displayValue}`);
        }
      }
      
      if (!allConfigured) {
        console.log('\n   ⚠ Some SMTP settings are missing. Emails will not be sent.');
      } else {
        console.log('\n   ✓ All required SMTP settings are configured');
      }
    }

    console.log('\n3. Testing email service initialization...');
    try {
      const { EmailService } = await import('../src/domains/mobile/email.service');
      const emailService = new EmailService();
      console.log('   ✓ EmailService can be instantiated');
      
      // Try to get config (this will fail if not configured, but that's OK)
      try {
        await (emailService as any).getEmailConfig();
        console.log('   ✓ Email configuration can be loaded');
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

checkEmailConfig();

