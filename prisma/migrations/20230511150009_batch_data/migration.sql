/*
  Warnings:

  - A unique constraint covering the columns `[idProducer]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "idProducer" INTEGER;

-- CreateTable
CREATE TABLE "Producer" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "idDepartment" INTEGER NOT NULL,
    "municipiality" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "idAssociation" INTEGER NOT NULL,
    "farmName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "nrOfHa" DECIMAL(65,30) NOT NULL,
    "nrCocoaHa" DECIMAL(65,30) NOT NULL,
    "nrForestHa" DECIMAL(65,30) NOT NULL,
    "nrCocoaLots" DECIMAL(65,30) NOT NULL,
    "nrWaterSources" DECIMAL(65,30) NOT NULL,
    "wildlife" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,

    CONSTRAINT "Producer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Association" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "nrOfAssociates" INTEGER NOT NULL,

    CONSTRAINT "Association_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "nrOfAssociates" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "idAssociation" INTEGER NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProducersBatch" (
    "id" SERIAL NOT NULL,
    "idProducer" INTEGER NOT NULL,
    "idBatch" INTEGER NOT NULL,

    CONSTRAINT "ProducersBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" SERIAL NOT NULL,
    "buyer" TEXT NOT NULL,
    "lotCode" TEXT NOT NULL,
    "negotiation" TEXT NOT NULL,
    "negotiationTerm" TEXT NOT NULL,
    "negotiationDate" TIMESTAMP(3) NOT NULL,
    "destination" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "pricePerKg" INTEGER NOT NULL,
    "totalValue" INTEGER NOT NULL,
    "idBatch" INTEGER NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Storage" (
    "id" SERIAL NOT NULL,
    "dayEntry" TIMESTAMP(3) NOT NULL,
    "netWeight" DECIMAL(65,30) NOT NULL,
    "conversionFaction" DECIMAL(65,30) NOT NULL,
    "fermentationPercentage" DECIMAL(65,30) NOT NULL,
    "grainIndex" DECIMAL(65,30) NOT NULL,
    "sensoryProfile" TEXT NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,
    "idBatch" INTEGER NOT NULL,

    CONSTRAINT "Storage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DryingPhase" (
    "id" SERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDryingDays" INTEGER NOT NULL,
    "finalGrainHumidity" INTEGER NOT NULL,
    "idBatch" INTEGER NOT NULL,

    CONSTRAINT "DryingPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FermentationPhase" (
    "id" SERIAL NOT NULL,
    "cocoaType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "genetics" TEXT NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL,
    "brixDegrees" DECIMAL(65,30) NOT NULL,
    "humidity" DECIMAL(65,30) NOT NULL,
    "hoursDrained" DECIMAL(65,30) NOT NULL,
    "nrFlips" DECIMAL(65,30) NOT NULL,
    "totalDays" DECIMAL(65,30) NOT NULL,
    "idBatch" INTEGER NOT NULL,

    CONSTRAINT "FermentationPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FermentationFlip" (
    "id" SERIAL NOT NULL,
    "index" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "time" INTEGER NOT NULL,
    "temp" DECIMAL(65,30) NOT NULL,
    "ambient" DECIMAL(65,30) NOT NULL,
    "humidity" DECIMAL(65,30) NOT NULL,
    "idFermentationPhase" INTEGER NOT NULL,

    CONSTRAINT "FermentationFlip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pulp" (
    "id" SERIAL NOT NULL,
    "idProducer" INTEGER NOT NULL,
    "collectionDate" TIMESTAMP(3) NOT NULL,
    "quality" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "genetics" TEXT NOT NULL,
    "totalPulpKg" DECIMAL(65,30) NOT NULL,
    "pricePerKg" DECIMAL(65,30) NOT NULL,
    "totalPrice" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Pulp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PulpBatch" (
    "id" SERIAL NOT NULL,
    "idBatch" INTEGER NOT NULL,
    "idPulp" INTEGER NOT NULL,

    CONSTRAINT "PulpBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Producer_code_key" ON "Producer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_code_key" ON "Batch"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_idBatch_key" ON "Sale"("idBatch");

-- CreateIndex
CREATE UNIQUE INDEX "Storage_idBatch_key" ON "Storage"("idBatch");

-- CreateIndex
CREATE UNIQUE INDEX "DryingPhase_idBatch_key" ON "DryingPhase"("idBatch");

-- CreateIndex
CREATE UNIQUE INDEX "FermentationPhase_idBatch_key" ON "FermentationPhase"("idBatch");

-- CreateIndex
CREATE UNIQUE INDEX "User_idProducer_key" ON "User"("idProducer");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_idProducer_fkey" FOREIGN KEY ("idProducer") REFERENCES "Producer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producer" ADD CONSTRAINT "Producer_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producer" ADD CONSTRAINT "Producer_idAssociation_fkey" FOREIGN KEY ("idAssociation") REFERENCES "Association"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_idAssociation_fkey" FOREIGN KEY ("idAssociation") REFERENCES "Association"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducersBatch" ADD CONSTRAINT "ProducersBatch_idProducer_fkey" FOREIGN KEY ("idProducer") REFERENCES "Producer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducersBatch" ADD CONSTRAINT "ProducersBatch_idBatch_fkey" FOREIGN KEY ("idBatch") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_idBatch_fkey" FOREIGN KEY ("idBatch") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Storage" ADD CONSTRAINT "Storage_idBatch_fkey" FOREIGN KEY ("idBatch") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DryingPhase" ADD CONSTRAINT "DryingPhase_idBatch_fkey" FOREIGN KEY ("idBatch") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FermentationPhase" ADD CONSTRAINT "FermentationPhase_idBatch_fkey" FOREIGN KEY ("idBatch") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FermentationFlip" ADD CONSTRAINT "FermentationFlip_idFermentationPhase_fkey" FOREIGN KEY ("idFermentationPhase") REFERENCES "FermentationPhase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pulp" ADD CONSTRAINT "Pulp_idProducer_fkey" FOREIGN KEY ("idProducer") REFERENCES "Producer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PulpBatch" ADD CONSTRAINT "PulpBatch_idBatch_fkey" FOREIGN KEY ("idBatch") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PulpBatch" ADD CONSTRAINT "PulpBatch_idPulp_fkey" FOREIGN KEY ("idPulp") REFERENCES "Pulp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
