/*
  Warnings:

  - You are about to drop the `ProducersBatch` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProducersBatch" DROP CONSTRAINT "ProducersBatch_codeBatch_fkey";

-- DropForeignKey
ALTER TABLE "ProducersBatch" DROP CONSTRAINT "ProducersBatch_codeProducer_fkey";

-- DropTable
DROP TABLE "ProducersBatch";
