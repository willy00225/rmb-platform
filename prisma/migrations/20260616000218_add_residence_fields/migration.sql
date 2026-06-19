-- AlterTable
ALTER TABLE "User" ADD COLUMN     "canton" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "currentCity" TEXT,
ADD COLUMN     "currentCountry" TEXT NOT NULL DEFAULT 'CI',
ADD COLUMN     "currentVillage" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "village" TEXT;
