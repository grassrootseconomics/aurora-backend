/*
  Warnings:

  - You are about to drop the column `dataSnapshot` on the `Certification` table. All the data in the column will be lost.
  - You are about to drop the column `dateCertified` on the `Certification` table. All the data in the column will be lost.
  - Added the required column `dateFingerprint` to the `Certification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Certification" DROP COLUMN "dataSnapshot",
DROP COLUMN "dateCertified",
ADD COLUMN     "dateFingerprint" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "dateSigned" TIMESTAMP(3);
