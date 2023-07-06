/*
  Warnings:

  - You are about to drop the column `buyerWallet` on the `Certification` table. All the data in the column will be lost.
  - You are about to drop the column `minterWallet` on the `Certification` table. All the data in the column will be lost.
  - You are about to drop the column `tokenId` on the `Certification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Certification" DROP COLUMN "buyerWallet",
DROP COLUMN "minterWallet",
DROP COLUMN "tokenId";

-- AlterTable
ALTER TABLE "Department" ALTER COLUMN "nextHarvest" SET DEFAULT now() + interval '1 month';

-- CreateTable
CREATE TABLE "CertificateOwner" (
    "id" SERIAL NOT NULL,
    "certificationKey" TEXT NOT NULL,
    "minterWallet" TEXT NOT NULL,
    "buyerWallet" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,

    CONSTRAINT "CertificateOwner_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CertificateOwner" ADD CONSTRAINT "CertificateOwner_certificationKey_fkey" FOREIGN KEY ("certificationKey") REFERENCES "Certification"("key") ON DELETE CASCADE ON UPDATE CASCADE;
