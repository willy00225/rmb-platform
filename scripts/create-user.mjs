import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash("Test1234", 12);
  const user = await prisma.user.create({
    data: {
      firstName: "Jean",
      lastName: "Bété",
      email: "jean@example.com",
      passwordHash: hash,
    },
  });
  console.log("Utilisateur créé :", user.email);
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
  })
  .finally(() => pool.end());