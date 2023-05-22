/*
  Warnings:

  - You are about to drop the column `idUser` on the `Nonce` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userWallet]` on the table `Nonce` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userWallet` to the `Nonce` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Nonce" DROP CONSTRAINT "Nonce_idUser_fkey";

-- DropIndex
DROP INDEX "Nonce_idUser_key";

-- AlterTable
ALTER TABLE "Nonce" DROP COLUMN "idUser",
ADD COLUMN     "userWallet" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "idRole" SET DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "Nonce_userWallet_key" ON "Nonce"("userWallet");

-- AddForeignKey
ALTER TABLE "Nonce" ADD CONSTRAINT "Nonce_userWallet_fkey" FOREIGN KEY ("userWallet") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
