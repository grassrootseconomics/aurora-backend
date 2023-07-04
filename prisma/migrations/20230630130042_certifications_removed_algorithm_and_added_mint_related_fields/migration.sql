/*
  Warnings:

  - You are about to drop the column `algoFingerprint` on the `Certification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Certification" DROP COLUMN "algoFingerprint",
ADD COLUMN     "buyerWallet" TEXT,
ADD COLUMN     "minterWallet" TEXT,
ADD COLUMN     "tokenId" TEXT;
