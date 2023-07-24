/*
  Warnings:

  - You are about to drop the column `percentageWomen` on the `Association` table. All the data in the column will be lost.
  - You are about to drop the column `percentageYoungPeople` on the `Association` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Association" DROP COLUMN "percentageWomen",
DROP COLUMN "percentageYoungPeople",
ADD COLUMN     "nrWomen" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "nrYoungPeople" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Department" ALTER COLUMN "nextHarvest" SET DEFAULT now() + interval '1 month';
