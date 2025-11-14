/**
 * Database Seed Script
 * Creates initial admin user for Election Management System
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create initial super admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@elections.ke' },
    update: {}, // Don't update if exists
    create: {
      nationalId: '00000001',
      email: 'admin@elections.ke',
      phoneNumber: '+254700000001',
      firstName: 'System',
      lastName: 'Administrator',
      passwordHash: '$2b$12$xZO3BpMWh5bhejhGOzLwTe2jnPX1ppij3qB4Lr300/tUdrrNZeEWm',
      role: 'super_admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✓ Created super admin user:', {
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
  });

  // Create initial election manager user
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@elections.ke' },
    update: {},
    create: {
      nationalId: '00000002',
      email: 'manager@elections.ke',
      phoneNumber: '+254700000002',
      firstName: 'Election',
      lastName: 'Manager',
      passwordHash:
        '$2b$12$hGD31n5L.IHO98SieseYy.Q3Vu7/vWVAjabIdeFykF0CymjDHxEx6',
      role: 'election_manager',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✓ Created election manager user:', {
    id: managerUser.id,
    email: managerUser.email,
    role: managerUser.role,
  });

  // Create geographic scopes for admin (national level)
  const existingScope = await prisma.userGeographicScope.findFirst({
    where: {
      userId: adminUser.id,
      scopeLevel: 'national',
    },
  });

  if (!existingScope) {
    await prisma.userGeographicScope.create({
      data: {
        userId: adminUser.id,
        scopeLevel: 'national',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✓ Assigned national scope to super admin');
  } else {
    console.log('✓ National scope already exists for super admin');
  }

  const defaultPolicies = [
    {
        name: 'Election Day Hours Restriction',
        description:
          'Restrict result submissions to election day hours (6 AM - 5 PM)',
        effect: 'allow',
        priority: 10,
        roles: ['field_observer', 'election_manager'],
        resourceType: 'election_result',
        actions: ['submit', 'create'],
        conditions: {
          note: 'This is a sample policy. Update timeRange when actual election is scheduled',
          requiresActiveElection: true,
        },
      isActive: false, // Disabled by default until real schedule is set
      statusMessage: 'sample access policy',
    },
    {
        name: 'Public Viewer Read-Only Access',
        description: 'Public viewers can only read confirmed election results',
        effect: 'allow',
        priority: 5,
        roles: ['public_viewer'],
        resourceType: 'election_result',
        actions: ['read'],
        conditions: {
          resultStatus: ['confirmed', 'verified'],
        },
        isActive: true,
      statusMessage: 'public viewer policy',
    },
  ];

  for (const policy of defaultPolicies) {
    const existingPolicy = await prisma.accessPolicy.findFirst({
      where: { name: policy.name },
    });

    if (existingPolicy) {
      console.log(`✓ ${policy.name} already exists`);
      continue;
    }

    await prisma.accessPolicy.create({
      data: {
        name: policy.name,
        description: policy.description,
        effect: policy.effect,
        priority: policy.priority,
        roles: policy.roles,
        resourceType: policy.resourceType,
        actions: policy.actions,
        conditions: policy.conditions,
        isActive: policy.isActive,
        createdBy: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`✓ Created ${policy.statusMessage}: ${policy.name}`);
  }

  await seedSmsTemplates();

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📝 Initial Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Super Admin:');
  console.log('  Email:    admin@elections.ke');
  console.log('  Password: Admin@2024!Secure');
  console.log('  Scope:    National (Full Access)');
  console.log('');
  console.log('Election Manager:');
  console.log('  Email:    manager@elections.ke');
  console.log('  Password: Manager@2024!Secure');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📋 ABAC Policies Created:');
  console.log('  • Election Day Hours Restriction (disabled)');
  console.log('  • Public Viewer Read-Only Access (active)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📧 System Configurations:');
  console.log('  • Email service settings configured');
  console.log('  • Security and authentication settings');
  console.log('  • Storage and rate limiting configurations');
  console.log('  • Database and notification settings');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(
    '\n⚠️  IMPORTANT: Change these passwords immediately after first login!'
  );
  console.log(
    '⚠️  IMPORTANT: Configure SMTP credentials in System Configurations to enable email service!'
  );
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

async function seedSmsTemplates() {
  console.log('📱 Seeding SMS templates...');

  const templates = [
    {
      name: 'Registration Confirmation SMS',
      templateType: 'registration_confirmation',
      body:
        'Hi {{firstName}}, we received your observer application (Ref: {{trackingNumber}}). You will be notified once it is reviewed.',
      description: 'Sent to observers immediately after registration',
      variables: {
        firstName: 'Observer first name',
        trackingNumber: 'Application tracking number',
      },
    },
    {
      name: 'Password Setup SMS',
      templateType: 'password_setup',
      body:
        'Hi {{firstName}}, your observer application was approved. Set your password here: {{setupUrl}} (link expires in 48 hrs).',
      description: 'Guides newly approved observers to set their password',
      variables: {
        firstName: 'Observer first name',
        setupUrl: 'Password setup URL',
      },
    },
    {
      name: 'Welcome SMS',
      templateType: 'welcome',
      body:
        'Welcome {{firstName}}! Your observer account is active. Login to the observer portal here: {{loginUrl}}.',
      description: 'Sent after password setup is completed',
      variables: {
        firstName: 'Observer first name',
        loginUrl: 'Observer portal login URL',
      },
    },
    {
      name: 'Rejection SMS',
      templateType: 'rejection',
      body:
        'Hello {{firstName}}, we’re unable to approve your observer application at this time. Reason: {{rejectionReason}}.',
      description: 'Sent when an application is rejected',
      variables: {
        firstName: 'Observer first name',
        rejectionReason: 'Reason for rejection',
      },
    },
    {
      name: 'Clarification Request SMS',
      templateType: 'clarification_request',
      body:
        'Hi {{firstName}}, we need more info for your application. Please check {{trackingUrl}} and update Ref: {{trackingNumber}}.',
      description: 'Requests additional information from the applicant',
      variables: {
        firstName: 'Observer first name',
        trackingUrl: 'Tracking portal link',
        trackingNumber: 'Application reference number',
      },
    },
    {
      name: 'Election Update SMS',
      templateType: 'election_update',
      body:
        'Reminder {{firstName}}: Election {{electionCode}} timeline updated. Check the portal for your assignments.',
      description: 'Used to notify observers about election updates',
      variables: {
        firstName: 'Observer first name',
        electionCode: 'Election unique code',
      },
    },
    {
      name: 'General Notification SMS',
      templateType: 'general_notification',
      body:
        'Hello {{firstName}}, you have a new notification in the observer portal. Please login to view.',
      description: 'Generic notification for miscellaneous updates',
      variables: {
        firstName: 'Observer first name',
      },
    },
  ];

  for (const template of templates) {
    await prisma.smsTemplate.upsert({
      where: { templateType: template.templateType },
      update: {
        name: template.name,
        body: template.body,
        description: template.description,
        variables: template.variables,
        isActive: true,
      },
      create: {
        name: template.name,
        body: template.body,
        description: template.description,
        templateType: template.templateType,
        variables: template.variables,
        isActive: true,
      },
    });
  }

  console.log('✅ SMS templates seeded successfully');
}
