-- AlterTable
ALTER TABLE "Department" ALTER COLUMN "nextHarvest" SET DEFAULT now() + interval '1 month';

-- AlterTable
ALTER TABLE "DryingPhase" ALTER COLUMN "finalGrainHumidity" SET DATA TYPE DECIMAL(65,30);
