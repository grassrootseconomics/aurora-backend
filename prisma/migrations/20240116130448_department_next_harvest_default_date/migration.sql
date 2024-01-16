-- AlterTable
ALTER TABLE "Department" ALTER COLUMN "nextHarvest" SET DEFAULT now() + interval '1 month';
