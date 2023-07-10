/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `Certification` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `signerWallet` to the `Certification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Certification" ADD COLUMN     "key" TEXT,
ADD COLUMN     "signerWallet" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Certification_key_key" ON "Certification"("key");
