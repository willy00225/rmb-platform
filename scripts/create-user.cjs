const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Test1234', 12);
  const user = await prisma.user.create({
    data: {
      firstName: 'Jean',
      lastName: 'Bété',
      email: 'jean@example.com',
      passwordHash: hash,
    },
  });
  console.log('Utilisateur créé :', user.email);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Erreur :', e);
  prisma.$disconnect();
});