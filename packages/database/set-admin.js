const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.user.update({
    where: { email: 'admin@extim.com' },
    data: { role: 'SUPER_ADMIN' }
  });
  console.log('Updated user admin@extim.com to SUPER_ADMIN');
}
main().catch(console.error).finally(() => prisma.$disconnect());
