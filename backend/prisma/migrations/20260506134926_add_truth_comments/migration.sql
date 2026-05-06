-- AlterEnum
ALTER TYPE "LikeTargetType" ADD VALUE 'truth_comment';

-- CreateTable
CREATE TABLE "TruthComment" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "truthId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TruthComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TruthComment_truthId_idx" ON "TruthComment"("truthId");

-- CreateIndex
CREATE INDEX "TruthComment_userId_idx" ON "TruthComment"("userId");

-- CreateIndex
CREATE INDEX "TruthComment_parentId_idx" ON "TruthComment"("parentId");

-- AddForeignKey
ALTER TABLE "TruthComment" ADD CONSTRAINT "TruthComment_truthId_fkey" FOREIGN KEY ("truthId") REFERENCES "Truth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruthComment" ADD CONSTRAINT "TruthComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruthComment" ADD CONSTRAINT "TruthComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TruthComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
