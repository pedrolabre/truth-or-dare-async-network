-- AlterTable
ALTER TABLE "Dare" ADD COLUMN     "attemptsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completedAt" TIMESTAMP(3);
