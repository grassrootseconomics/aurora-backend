/*
  Warnings:

  - You are about to drop the column `idAssociation` on the `Batch` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Batch" DROP CONSTRAINT "Batch_idAssociation_fkey";

-- AlterTable
ALTER TABLE "Batch" DROP COLUMN "idAssociation";
