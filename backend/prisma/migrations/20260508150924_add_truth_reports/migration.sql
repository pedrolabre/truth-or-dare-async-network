-- CreateTable
CREATE TABLE "TruthReport" (
    "id" TEXT NOT NULL,
    "truthId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TruthReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TruthCommentReport" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TruthCommentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TruthReport_truthId_idx" ON "TruthReport"("truthId");

-- CreateIndex
CREATE INDEX "TruthReport_userId_idx" ON "TruthReport"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TruthReport_truthId_userId_key" ON "TruthReport"("truthId", "userId");

-- CreateIndex
CREATE INDEX "TruthCommentReport_commentId_idx" ON "TruthCommentReport"("commentId");

-- CreateIndex
CREATE INDEX "TruthCommentReport_userId_idx" ON "TruthCommentReport"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TruthCommentReport_commentId_userId_key" ON "TruthCommentReport"("commentId", "userId");

-- AddForeignKey
ALTER TABLE "TruthReport" ADD CONSTRAINT "TruthReport_truthId_fkey" FOREIGN KEY ("truthId") REFERENCES "Truth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruthReport" ADD CONSTRAINT "TruthReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruthCommentReport" ADD CONSTRAINT "TruthCommentReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "TruthComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruthCommentReport" ADD CONSTRAINT "TruthCommentReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
