import { PrismaClient, GlobalRole } from '@saas/database';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@extim.com';
  const password = await bcrypt.hash('Aa2916519', 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password,
      role: GlobalRole.SUPER_ADMIN,
    },
    create: {
      email,
      password,
      role: GlobalRole.SUPER_ADMIN,
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
