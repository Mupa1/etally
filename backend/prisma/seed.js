/**
 * Database Seed Script
 * Creates initial admin user for Election Management System
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password for initial admin
  const SALT_ROUNDS = 12;
  const defaultPassword = 'Admin@2024!Secure';
  const passwordHash = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

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
      passwordHash,
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
  const managerPasswordHash = await bcrypt.hash(
    'Manager@2024!Secure',
    SALT_ROUNDS
  );
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@elections.ke' },
    update: {},
    create: {
      nationalId: '00000002',
      email: 'manager@elections.ke',
      phoneNumber: '+254700000002',
      firstName: 'Election',
      lastName: 'Manager',
      passwordHash: managerPasswordHash,
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

  // Create sample access policy: Election hours only
  const existingElectionPolicy = await prisma.accessPolicy.findFirst({
    where: {
      name: 'Election Day Hours Restriction',
    },
  });

  if (!existingElectionPolicy) {
    const electionHoursPolicy = await prisma.accessPolicy.create({
      data: {
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
        isActive: false, // Disabled by default
        createdBy: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✓ Created sample access policy:', electionHoursPolicy.name);
  } else {
    console.log('✓ Election hours policy already exists');
  }

  // Create another policy: Read-only for public viewers
  const existingPublicPolicy = await prisma.accessPolicy.findFirst({
    where: {
      name: 'Public Viewer Read-Only Access',
    },
  });

  if (!existingPublicPolicy) {
    const publicViewerPolicy = await prisma.accessPolicy.create({
      data: {
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
        createdBy: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✓ Created public viewer policy:', publicViewerPolicy.name);
  } else {
    console.log('✓ Public viewer policy already exists');
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
