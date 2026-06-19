import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.pricingConfig.createMany({
    data: [
      { featureKey: "premium_monthly", amount: 500, active: true, label: "Abonnement Premium mensuel" },
      { featureKey: "boost_1", amount: 200, active: true, label: "1 Boost supplémentaire" },
      { featureKey: "boost_3", amount: 500, active: true, label: "3 Boosts supplémentaires" },
      { featureKey: "boost_7", amount: 1000, active: true, label: "7 Boosts supplémentaires" },
    ],
    skipDuplicates: true,
  });
  await prisma.premiumFeature.createMany({
    data: [
      { featureKey: "badge_premium", label: "Badge Premium", description: "Coche verte de certification", active: true },
      { featureKey: "custom_banner", label: "Bannière personnalisée", description: "Ajoutez une bannière à votre profil", active: true },
      { featureKey: "early_events", label: "Accès anticipé", description: "Inscrivez-vous avant tout le monde", active: true },
      { featureKey: "extra_boosts", label: "Boosts offerts", description: "3 boosts gratuits par mois", active: true },
    ],
    skipDuplicates: true,
  });
  console.log("Configurations Premium insérées.");
  await prisma.$disconnect();
  pool.end();
}

main().catch(e => { console.error(e); prisma.$disconnect(); pool.end(); });