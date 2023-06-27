/*
  Warnings:

  - You are about to alter the column `score` on the `Storage` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Storage" ALTER COLUMN "score" SET DATA TYPE INTEGER;
