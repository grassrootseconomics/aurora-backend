/*
  Warnings:

  - You are about to drop the column `departmentId` on the `Producer` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Producer" DROP CONSTRAINT "Producer_departmentId_fkey";

-- AlterTable
ALTER TABLE "Producer" DROP COLUMN "departmentId";

-- AddForeignKey
ALTER TABLE "Producer" ADD CONSTRAINT "Producer_idDepartment_fkey" FOREIGN KEY ("idDepartment") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
