const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.task.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('All users and tasks deleted completely.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
