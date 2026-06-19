const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Remplace par un ID utilisateur existant (par exemple l'admin ou toi-même)
  const user = await prisma.user.findFirst({ where: { email: 'jean@example.com' } });
  if (!user) {
    console.error('Utilisateur non trouvé');
    return;
  }
  const event = await prisma.event.create({
    data: {
      title: 'Assemblée Générale 2026',
      description: 'Réunion annuelle du Réseau Mondial des Bétés',
      startDate: new Date('2026-07-15T10:00:00'),
      endDate: new Date('2026-07-15T12:00:00'),
      location: 'Abidjan, Cocody',
      organizerId: user.id,
    },
  });
  console.log('Événement créé :', event.title);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
});