/*
  Warnings:

  - A unique constraint covering the columns `[idFermentationPhase,day]` on the table `FermentationDayReport` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idFermentationPhase,index]` on the table `FermentationFlip` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FermentationDayReport_idFermentationPhase_day_key" ON "FermentationDayReport"("idFermentationPhase", "day");

-- CreateIndex
CREATE UNIQUE INDEX "FermentationFlip_idFermentationPhase_index_key" ON "FermentationFlip"("idFermentationPhase", "index");
