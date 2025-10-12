/**
 * Database Seed Script
 * Creates initial admin user for Kenya Election Management System
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

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📝 Initial Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Super Admin:');
  console.log('  Email:    admin@elections.ke');
  console.log('  Password: Admin@2024!Secure');
  console.log('');
  console.log('Election Manager:');
  console.log('  Email:    manager@elections.ke');
  console.log('  Password: Manager@2024!Secure');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(
    '\n⚠️  IMPORTANT: Change these passwords immediately after first login!'
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
