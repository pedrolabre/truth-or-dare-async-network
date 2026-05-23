-- CreateEnum
CREATE TYPE "ClubReportTargetType" AS ENUM ('club', 'club_prompt', 'club_prompt_response', 'club_prompt_comment');

-- CreateTable
CREATE TABLE "ClubReport" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "ClubReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClubReport_clubId_idx" ON "ClubReport"("clubId");

-- CreateIndex
CREATE INDEX "ClubReport_reporterId_idx" ON "ClubReport"("reporterId");

-- CreateIndex
CREATE INDEX "ClubReport_targetType_targetId_idx" ON "ClubReport"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "ClubReport_clubId_targetType_idx" ON "ClubReport"("clubId", "targetType");

-- CreateIndex
CREATE INDEX "ClubReport_createdAt_idx" ON "ClubReport"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClubReport_reporterId_targetType_targetId_key" ON "ClubReport"("reporterId", "targetType", "targetId");

-- AddForeignKey
ALTER TABLE "ClubReport" ADD CONSTRAINT "ClubReport_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubReport" ADD CONSTRAINT "ClubReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
