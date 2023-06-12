/*
  Warnings:

  - You are about to drop the column `emailAddress` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Association" ADD COLUMN     "emailAddress" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailAddress";
