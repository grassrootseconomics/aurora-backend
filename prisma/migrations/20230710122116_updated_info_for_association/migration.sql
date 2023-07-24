-- AlterTable
ALTER TABLE "Association" ADD COLUMN     "municipiality" TEXT,
ADD COLUMN     "percentageWomen" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "percentageYoungPeople" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "sensoryProfile" TEXT,
ALTER COLUMN "nrOfAssociates" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Department" ALTER COLUMN "nextHarvest" SET DEFAULT now() + interval '1 month';
