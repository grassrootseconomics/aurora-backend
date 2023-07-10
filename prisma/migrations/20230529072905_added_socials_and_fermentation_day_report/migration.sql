-- AlterTable
ALTER TABLE "Association" ADD COLUMN     "fbSocialLink" TEXT,
ADD COLUMN     "instSocialLink" TEXT;

-- CreateTable
CREATE TABLE "FermentationDayReport" (
    "id" SERIAL NOT NULL,
    "day" INTEGER NOT NULL,
    "temperatureMass" DECIMAL(65,30) NOT NULL,
    "phMass" DECIMAL(65,30) NOT NULL,
    "phCotiledon" DECIMAL(65,30) NOT NULL,
    "idFermentationPhase" INTEGER NOT NULL,

    CONSTRAINT "FermentationDayReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FermentationDayReport" ADD CONSTRAINT "FermentationDayReport_idFermentationPhase_fkey" FOREIGN KEY ("idFermentationPhase") REFERENCES "FermentationPhase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
