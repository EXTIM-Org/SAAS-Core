import { PrismaClient } from '@saas/database';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@extim.com';
  const password = await bcrypt.hash('Aa2916519', 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password,
      globalRole: 'SUPER_ADMIN',
    },
    create: {
      email,
      password,
      firstName: 'Admin',
      lastName: 'User',
      globalRole: 'SUPER_ADMIN',
    },
  });

  console.log('Admin user created successfully:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
