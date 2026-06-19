import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.badge.createMany({
    data: [
      { name: "Premier don", description: "Avoir effectué au moins un don", icon: "💝", condition: "first_donation" },
      { name: "5 publications", description: "Avoir publié 5 posts", icon: "📝", condition: "five_posts" },
      { name: "Participant", description: "Avoir participé à un événement", icon: "🎉", condition: "first_event" },
      { name: "Niveau 5", description: "Atteindre le niveau 5", icon: "⭐", condition: "level_5" },
      { name: "Social", description: "Avoir posté 10 commentaires", icon: "💬", condition: "ten_comments" },
    ],
    skipDuplicates: true,
  });
  console.log("Badges insérés.");
  await prisma.$disconnect();
  pool.end();
}

main().catch(e => { console.error(e); prisma.$disconnect(); pool.end(); });