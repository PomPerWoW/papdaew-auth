const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'vendor@example.com' },
    update: {},
    create: {
      email: 'vendor@example.com',
      username: 'vendor',
      password: await bcrypt.hash('vendor123', 10),
      role: 'VENDOR',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      username: 'customer',
      password: await bcrypt.hash('customer123', 10),
      role: 'CUSTOMER',
      isActive: true,
    },
  });
}

main()
  .catch(e => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
