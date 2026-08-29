const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'SUPER_ADMIN' }
    });
    console.log(`Updated user ${user.email} to SUPER_ADMIN`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
