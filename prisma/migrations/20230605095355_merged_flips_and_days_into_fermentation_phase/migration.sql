/*
  Warnings:

  - You are about to drop the `FermentationDayReport` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FermentationFlip` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FermentationDayReport" DROP CONSTRAINT "FermentationDayReport_idFermentationPhase_fkey";

-- DropForeignKey
ALTER TABLE "FermentationFlip" DROP CONSTRAINT "FermentationFlip_idFermentationPhase_fkey";

-- AlterTable
ALTER TABLE "FermentationPhase" ADD COLUMN     "dailyReports" JSONB[],
ADD COLUMN     "flips" JSONB[];

-- DropTable
DROP TABLE "FermentationDayReport";

-- DropTable
DROP TABLE "FermentationFlip";
