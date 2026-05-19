import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const providers = await prisma.provider.findMany({ select: { slug: true, displayName: true } });
  console.log(JSON.stringify(providers, null, 2));
  await prisma.$disconnect();
})();
