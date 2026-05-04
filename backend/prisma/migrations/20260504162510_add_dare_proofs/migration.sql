-- CreateEnum
CREATE TYPE "ProofMediaType" AS ENUM ('video', 'audio', 'file');

-- CreateTable
CREATE TABLE "DareProof" (
    "id" TEXT NOT NULL,
    "dareId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaType" "ProofMediaType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DareProof_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DareProof_dareId_idx" ON "DareProof"("dareId");

-- CreateIndex
CREATE INDEX "DareProof_userId_idx" ON "DareProof"("userId");

-- AddForeignKey
ALTER TABLE "DareProof" ADD CONSTRAINT "DareProof_dareId_fkey" FOREIGN KEY ("dareId") REFERENCES "Dare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DareProof" ADD CONSTRAINT "DareProof_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
