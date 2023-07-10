/*
  Warnings:

  - You are about to drop the column `idBatch` on the `DryingPhase` table. All the data in the column will be lost.
  - You are about to drop the column `idBatch` on the `FermentationPhase` table. All the data in the column will be lost.
  - You are about to drop the column `idBatch` on the `ProducersBatch` table. All the data in the column will be lost.
  - You are about to drop the column `idProducer` on the `ProducersBatch` table. All the data in the column will be lost.
  - You are about to drop the column `idProducer` on the `Pulp` table. All the data in the column will be lost.
  - You are about to drop the column `idBatch` on the `PulpBatch` table. All the data in the column will be lost.
  - You are about to drop the column `idBatch` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `idBatch` on the `Storage` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[codeBatch]` on the table `DryingPhase` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[codeBatch]` on the table `FermentationPhase` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[codeBatch]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[codeBatch]` on the table `Storage` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codeBatch` to the `DryingPhase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codeBatch` to the `FermentationPhase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codeBatch` to the `ProducersBatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codeProducer` to the `ProducersBatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codeProducer` to the `Pulp` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codeBatch` to the `PulpBatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codeBatch` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codeBatch` to the `Storage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DryingPhase" DROP CONSTRAINT "DryingPhase_idBatch_fkey";

-- DropForeignKey
ALTER TABLE "FermentationPhase" DROP CONSTRAINT "FermentationPhase_idBatch_fkey";

-- DropForeignKey
ALTER TABLE "ProducersBatch" DROP CONSTRAINT "ProducersBatch_idBatch_fkey";

-- DropForeignKey
ALTER TABLE "ProducersBatch" DROP CONSTRAINT "ProducersBatch_idProducer_fkey";

-- DropForeignKey
ALTER TABLE "Pulp" DROP CONSTRAINT "Pulp_idProducer_fkey";

-- DropForeignKey
ALTER TABLE "PulpBatch" DROP CONSTRAINT "PulpBatch_idBatch_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_idBatch_fkey";

-- DropForeignKey
ALTER TABLE "Storage" DROP CONSTRAINT "Storage_idBatch_fkey";

-- DropIndex
DROP INDEX "DryingPhase_idBatch_key";

-- DropIndex
DROP INDEX "FermentationPhase_idBatch_key";

-- DropIndex
DROP INDEX "Sale_idBatch_key";

-- DropIndex
DROP INDEX "Storage_idBatch_key";

-- AlterTable
ALTER TABLE "DryingPhase" DROP COLUMN "idBatch",
ADD COLUMN     "codeBatch" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "FermentationPhase" DROP COLUMN "idBatch",
ADD COLUMN     "codeBatch" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProducersBatch" DROP COLUMN "idBatch",
DROP COLUMN "idProducer",
ADD COLUMN     "codeBatch" TEXT NOT NULL,
ADD COLUMN     "codeProducer" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Pulp" DROP COLUMN "idProducer",
ADD COLUMN     "codeProducer" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PulpBatch" DROP COLUMN "idBatch",
ADD COLUMN     "codeBatch" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "idBatch",
ADD COLUMN     "codeBatch" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Storage" DROP COLUMN "idBatch",
ADD COLUMN     "codeBatch" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DryingPhase_codeBatch_key" ON "DryingPhase"("codeBatch");

-- CreateIndex
CREATE UNIQUE INDEX "FermentationPhase_codeBatch_key" ON "FermentationPhase"("codeBatch");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_codeBatch_key" ON "Sale"("codeBatch");

-- CreateIndex
CREATE UNIQUE INDEX "Storage_codeBatch_key" ON "Storage"("codeBatch");

-- AddForeignKey
ALTER TABLE "ProducersBatch" ADD CONSTRAINT "ProducersBatch_codeProducer_fkey" FOREIGN KEY ("codeProducer") REFERENCES "Producer"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducersBatch" ADD CONSTRAINT "ProducersBatch_codeBatch_fkey" FOREIGN KEY ("codeBatch") REFERENCES "Batch"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_codeBatch_fkey" FOREIGN KEY ("codeBatch") REFERENCES "Batch"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Storage" ADD CONSTRAINT "Storage_codeBatch_fkey" FOREIGN KEY ("codeBatch") REFERENCES "Batch"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DryingPhase" ADD CONSTRAINT "DryingPhase_codeBatch_fkey" FOREIGN KEY ("codeBatch") REFERENCES "Batch"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FermentationPhase" ADD CONSTRAINT "FermentationPhase_codeBatch_fkey" FOREIGN KEY ("codeBatch") REFERENCES "Batch"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pulp" ADD CONSTRAINT "Pulp_codeProducer_fkey" FOREIGN KEY ("codeProducer") REFERENCES "Producer"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PulpBatch" ADD CONSTRAINT "PulpBatch_codeBatch_fkey" FOREIGN KEY ("codeBatch") REFERENCES "Batch"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
