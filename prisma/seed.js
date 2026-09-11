  const candidates = [
    process.env.DATABASE_URL,
    process.env.mess_PRISMA_DATABASE_URL,
    process.env.mess_POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === 'string' &&
      (candidate.startsWith('postgresql://') || candidate.startsWith('postgres://'))
    ) {
      return candidate.trim();
    }
  }
  return undefined;
}

const resolvedDbUrl = getValidDatabaseUrl();
if (resolvedDbUrl) {
  process.env.DATABASE_URL = resolvedDbUrl;
}

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: resolvedDbUrl
    ? {
        db: {
          url: resolvedDbUrl,
        },
      }
    : undefined,
});

async function main() {
  console.log('🧹 Resetting all data... Removing all members, meals, and bazars.');

  // 1. Delete all meals
  await prisma.meal.deleteMany({});
  console.log('✔ All meal records deleted.');

  // 2. Delete all bazar expenses
  await prisma.bazar.deleteMany({});
  console.log('✔ All bazar records deleted.');

  // 3. Delete all users except manager
  await prisma.user.deleteMany({
    where: {
      email: {
        not: 'manager@mess.com',
      },
    },
  });
  console.log('✔ All member accounts deleted.');

  // 4. Create or reset the default Manager account
  const passwordHash = await bcrypt.hash('123456', 10);
  await prisma.user.upsert({
    where: { email: 'manager@mess.com' },
    update: {
      name: 'শামীম রানা (ম্যানেজার)',
      password: passwordHash,
      role: 'MANAGER',
      status: 'APPROVED',
      phone: '01700000001',
      deposit: 0,
    },
    create: {
      name: 'শামীম রানা (ম্যানেজার)',
      email: 'manager@mess.com',
      password: passwordHash,
      role: 'MANAGER',
      status: 'APPROVED',
      phone: '01700000001',
      deposit: 0,
    },
  });
  console.log('✔ Manager account created/reset: manager@mess.com / 123456');

  // 5. Reset Mess Settings to clean state
  await prisma.messSettings.upsert({
    where: { id: 'main_settings' },
    update: {
      messName: 'আমাদের মেস (Mess Calculation)',
      isLunchLocked: false,
      isDinnerLocked: false,
      lockPastDays: true,
      cutoffTime: '10:00',
      fixedCosts: 0,
    },
    create: {
      id: 'main_settings',
      messName: 'আমাদের মেস (Mess Calculation)',
      isLunchLocked: false,
      isDinnerLocked: false,
      lockPastDays: true,
      cutoffTime: '10:00',
      fixedCosts: 0,
    },
  });
  console.log('✔ Mess settings reset to fresh initial state.');

  console.log('🎉 Data reset complete! The system is now ready for your fresh real data.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
