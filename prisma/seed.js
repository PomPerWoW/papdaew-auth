const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const defaultPermissions = [
    { name: 'view_profile', description: 'Can view own profile' },
    { name: 'edit_profile', description: 'Can edit own profile' },
    { name: 'manage_queues', description: 'Can manage queues' },
    { name: 'view_queues', description: 'Can view queues' },
    { name: 'manage_users', description: 'Can manage users' },
    { name: 'manage_permissions', description: 'Can manage permissions' },
  ];

  for (const permission of defaultPermissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: '$2b$10$YourHashedAdminPassword',
      role: 'ADMIN',
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
        },
      },
    },
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
