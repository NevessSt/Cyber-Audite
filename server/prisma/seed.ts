import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@example.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'System Admin',
        role: 'ADMIN',
      },
    });
    console.log('Admin user created');
  } else {
    console.log('Admin user already exists');
  }

  // Sample Project
  const project = await prisma.auditProject.create({
    data: {
      name: 'E-Commerce Platform Audit',
      clientName: 'ShopifyClone Inc.',
      description: 'Full security audit of the main storefront',
      scope: 'Frontend, Backend API, Database',
      userId: existingAdmin ? existingAdmin.id : (await prisma.user.findFirstOrThrow()).id,
    },
  });
  console.log('Sample project created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
