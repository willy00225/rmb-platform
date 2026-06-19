/*
  Warnings:

  - You are about to drop the column `status` on the `MarketplacePurchase` table. All the data in the column will be lost.
  - You are about to drop the column `transactionRef` on the `MarketplacePurchase` table. All the data in the column will be lost.
  - Made the column `paymentId` on table `MarketplacePurchase` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "MarketplaceProduct" DROP CONSTRAINT "MarketplaceProduct_userId_fkey";

-- DropForeignKey
ALTER TABLE "MarketplacePurchase" DROP CONSTRAINT "MarketplacePurchase_buyerId_fkey";

-- DropForeignKey
ALTER TABLE "MarketplacePurchase" DROP CONSTRAINT "MarketplacePurchase_productId_fkey";

-- DropForeignKey
ALTER TABLE "MarketplacePurchase" DROP CONSTRAINT "MarketplacePurchase_sellerId_fkey";

-- AlterTable
ALTER TABLE "MarketplaceProduct" ALTER COLUMN "condition" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MarketplacePurchase" DROP COLUMN "status",
DROP COLUMN "transactionRef",
ADD COLUMN     "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "paymentId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "MarketplaceProduct" ADD CONSTRAINT "MarketplaceProduct_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePurchase" ADD CONSTRAINT "MarketplacePurchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePurchase" ADD CONSTRAINT "MarketplacePurchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePurchase" ADD CONSTRAINT "MarketplacePurchase_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
