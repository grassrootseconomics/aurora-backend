-- AlterTable
ALTER TABLE "Department" ALTER COLUMN "nextHarvest" SET DEFAULT now() + interval '1 month';

-- AlterTable
ALTER TABLE "FermentationPhase" ADD COLUMN     "initialTemp" DECIMAL(65,30),
ADD COLUMN     "roomTemp" DECIMAL(65,30);
