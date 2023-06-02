/*
  Warnings:

  - You are about to drop the column `birthDate` on the `Producer` table. All the data in the column will be lost.
  - Added the required column `birthYear` to the `Producer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Producer" DROP COLUMN "birthDate",
ADD COLUMN     "birthYear" INTEGER NOT NULL;
