-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "nextHarvest" TIMESTAMP(3) NOT NULL DEFAULT now() + interval '1 month';
