/*
  Warnings:

  - You are about to drop the column `dataFingerprint` on the `Certification` table. All the data in the column will be lost.
  - You are about to drop the column `dateFingerprint` on the `Certification` table. All the data in the column will be lost.
  - Made the column `signedDataFingerprint` on table `Certification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dateSigned` on table `Certification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `key` on table `Certification` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Certification_dataFingerprint_key";

-- AlterTable
ALTER TABLE "Certification" DROP COLUMN "dataFingerprint",
DROP COLUMN "dateFingerprint",
ALTER COLUMN "signedDataFingerprint" SET NOT NULL,
ALTER COLUMN "dateSigned" SET NOT NULL,
ALTER COLUMN "key" SET NOT NULL;

-- AlterTable
ALTER TABLE "Department" ALTER COLUMN "nextHarvest" SET DEFAULT now() + interval '1 month';
