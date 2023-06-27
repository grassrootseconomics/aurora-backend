-- CreateTable
CREATE TABLE "Certification" (
    "id" SERIAL NOT NULL,
    "codeBatch" TEXT NOT NULL,
    "dateCertified" TIMESTAMP(3) NOT NULL,
    "dataSnapshot" JSONB NOT NULL,
    "algoFingerprint" TEXT NOT NULL,
    "dataFingerprint" TEXT NOT NULL,
    "signedDataFingerprint" TEXT,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Certification_dataFingerprint_key" ON "Certification"("dataFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "Certification_signedDataFingerprint_key" ON "Certification"("signedDataFingerprint");

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_codeBatch_fkey" FOREIGN KEY ("codeBatch") REFERENCES "Batch"("code") ON DELETE CASCADE ON UPDATE CASCADE;
