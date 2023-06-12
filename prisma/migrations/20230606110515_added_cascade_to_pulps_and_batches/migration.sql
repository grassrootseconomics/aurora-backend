-- DropForeignKey
ALTER TABLE "PulpBatch" DROP CONSTRAINT "PulpBatch_codeBatch_fkey";

-- DropForeignKey
ALTER TABLE "PulpBatch" DROP CONSTRAINT "PulpBatch_idPulp_fkey";

-- AddForeignKey
ALTER TABLE "PulpBatch" ADD CONSTRAINT "PulpBatch_codeBatch_fkey" FOREIGN KEY ("codeBatch") REFERENCES "Batch"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PulpBatch" ADD CONSTRAINT "PulpBatch_idPulp_fkey" FOREIGN KEY ("idPulp") REFERENCES "Pulp"("id") ON DELETE CASCADE ON UPDATE CASCADE;
