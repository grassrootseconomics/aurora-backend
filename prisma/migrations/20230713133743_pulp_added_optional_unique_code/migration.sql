/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Pulp` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Department" ALTER COLUMN "nextHarvest" SET DEFAULT now() + interval '1 month';

-- AlterTable
ALTER TABLE "Pulp" ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Pulp_code_key" ON "Pulp"("code");
