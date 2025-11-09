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

  // Seed configurations
  try {
    const { seedConfigurations } = require('./seeds/configurations.seed.ts');
    await seedConfigurations();
  } catch (error) {
    console.error('❌ Failed to seed configurations:', error);
  }

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
