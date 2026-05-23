-- AlterEnum
ALTER TYPE "ClubMemberStatus" ADD VALUE 'blocked';

-- AlterTable
ALTER TABLE "Club" ADD COLUMN "blockedWords" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "ClubMember" ADD COLUMN "postingSuspendedUntil" TIMESTAMP(3);
