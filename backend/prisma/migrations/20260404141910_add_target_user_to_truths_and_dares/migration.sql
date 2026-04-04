/*
  Warnings:

  - Added the required column `targetUserId` to the `Dare` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetUserId` to the `Truth` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Dare" ADD COLUMN     "targetUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Truth" ADD COLUMN     "targetUserId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Dare_authorId_idx" ON "Dare"("authorId");

-- CreateIndex
CREATE INDEX "Dare_targetUserId_idx" ON "Dare"("targetUserId");

-- CreateIndex
CREATE INDEX "Truth_authorId_idx" ON "Truth"("authorId");

-- CreateIndex
CREATE INDEX "Truth_targetUserId_idx" ON "Truth"("targetUserId");

-- AddForeignKey
ALTER TABLE "Truth" ADD CONSTRAINT "Truth_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dare" ADD CONSTRAINT "Dare_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
