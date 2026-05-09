/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Club` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Club` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ClubMember` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ClubVisibility" AS ENUM ('public', 'private', 'invite_only');

-- CreateEnum
CREATE TYPE "ClubStatus" AS ENUM ('active', 'archived', 'suspended', 'deleted');

-- CreateEnum
CREATE TYPE "ClubMemberRole" AS ENUM ('owner', 'admin', 'moderator', 'member');

-- CreateEnum
CREATE TYPE "ClubMemberStatus" AS ENUM ('active', 'invited', 'requested', 'removed');

-- CreateEnum
CREATE TYPE "ClubPromptStatus" AS ENUM ('draft', 'published', 'archived', 'removed');

-- CreateEnum
CREATE TYPE "ClubJoinPolicy" AS ENUM ('open', 'approval_required', 'invite_only');

-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "iconName" TEXT NOT NULL DEFAULT 'groups',
ADD COLUMN     "lastActivityAt" TIMESTAMP(3),
ADD COLUMN     "memberCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "promptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rules" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "status" "ClubStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "visibility" "ClubVisibility" NOT NULL DEFAULT 'public';

-- AlterTable
ALTER TABLE "ClubMember" ADD COLUMN     "invitedById" TEXT,
ADD COLUMN     "joinedAt" TIMESTAMP(3),
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "mutedUntil" TIMESTAMP(3),
ADD COLUMN     "role" "ClubMemberRole" NOT NULL DEFAULT 'member',
ADD COLUMN     "status" "ClubMemberStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ClubPrompt" ADD COLUMN     "answersCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "commentsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "difficulty" TEXT,
ADD COLUMN     "isMembersOnly" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "likesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "removalReason" TEXT,
ADD COLUMN     "removedAt" TIMESTAMP(3),
ADD COLUMN     "removedById" TEXT,
ADD COLUMN     "status" "ClubPromptStatus" NOT NULL DEFAULT 'published';

-- CreateTable
CREATE TABLE "ClubInvite" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "status" "ClubMemberStatus" NOT NULL DEFAULT 'invited',
    "code" TEXT,
    "message" TEXT,
    "expiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubJoinRequest" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ClubMemberStatus" NOT NULL DEFAULT 'requested',
    "message" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubPromptResponse" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT,
    "mediaUrl" TEXT,
    "mediaType" "ProofMediaType",
    "dareProofId" TEXT,
    "attemptsUsed" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "removedById" TEXT,
    "removalReason" TEXT,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubPromptResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubPromptComment" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "responseId" TEXT,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "text" TEXT NOT NULL,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "repliesCount" INTEGER NOT NULL DEFAULT 0,
    "editedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "removedById" TEXT,
    "removalReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubPromptComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubAuditLog" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "actorId" TEXT,
    "targetUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClubInvite_inviteeId_status_idx" ON "ClubInvite"("inviteeId", "status");

-- CreateIndex
CREATE INDEX "ClubInvite_clubId_status_idx" ON "ClubInvite"("clubId", "status");

-- CreateIndex
CREATE INDEX "ClubInvite_inviterId_idx" ON "ClubInvite"("inviterId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubInvite_clubId_inviteeId_status_key" ON "ClubInvite"("clubId", "inviteeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ClubInvite_code_key" ON "ClubInvite"("code");

-- CreateIndex
CREATE INDEX "ClubJoinRequest_userId_status_idx" ON "ClubJoinRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "ClubJoinRequest_clubId_status_idx" ON "ClubJoinRequest"("clubId", "status");

-- CreateIndex
CREATE INDEX "ClubJoinRequest_reviewedById_idx" ON "ClubJoinRequest"("reviewedById");

-- CreateIndex
CREATE UNIQUE INDEX "ClubJoinRequest_clubId_userId_status_key" ON "ClubJoinRequest"("clubId", "userId", "status");

-- CreateIndex
CREATE INDEX "ClubPromptResponse_clubId_idx" ON "ClubPromptResponse"("clubId");

-- CreateIndex
CREATE INDEX "ClubPromptResponse_promptId_idx" ON "ClubPromptResponse"("promptId");

-- CreateIndex
CREATE INDEX "ClubPromptResponse_userId_idx" ON "ClubPromptResponse"("userId");

-- CreateIndex
CREATE INDEX "ClubPromptResponse_createdAt_idx" ON "ClubPromptResponse"("createdAt");

-- CreateIndex
CREATE INDEX "ClubPromptResponse_removedAt_idx" ON "ClubPromptResponse"("removedAt");

-- CreateIndex
CREATE INDEX "ClubPromptComment_clubId_idx" ON "ClubPromptComment"("clubId");

-- CreateIndex
CREATE INDEX "ClubPromptComment_promptId_idx" ON "ClubPromptComment"("promptId");

-- CreateIndex
CREATE INDEX "ClubPromptComment_responseId_idx" ON "ClubPromptComment"("responseId");

-- CreateIndex
CREATE INDEX "ClubPromptComment_userId_idx" ON "ClubPromptComment"("userId");

-- CreateIndex
CREATE INDEX "ClubPromptComment_parentId_idx" ON "ClubPromptComment"("parentId");

-- CreateIndex
CREATE INDEX "ClubPromptComment_createdAt_idx" ON "ClubPromptComment"("createdAt");

-- CreateIndex
CREATE INDEX "ClubPromptComment_removedAt_idx" ON "ClubPromptComment"("removedAt");

-- CreateIndex
CREATE INDEX "ClubAuditLog_clubId_idx" ON "ClubAuditLog"("clubId");

-- CreateIndex
CREATE INDEX "ClubAuditLog_actorId_idx" ON "ClubAuditLog"("actorId");

-- CreateIndex
CREATE INDEX "ClubAuditLog_targetUserId_idx" ON "ClubAuditLog"("targetUserId");

-- CreateIndex
CREATE INDEX "ClubAuditLog_action_idx" ON "ClubAuditLog"("action");

-- CreateIndex
CREATE INDEX "ClubAuditLog_createdAt_idx" ON "ClubAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");

-- CreateIndex
CREATE INDEX "Club_visibility_status_idx" ON "Club"("visibility", "status");

-- CreateIndex
CREATE INDEX "Club_visibility_status_lastActivityAt_idx" ON "Club"("visibility", "status", "lastActivityAt");

-- CreateIndex
CREATE INDEX "Club_name_idx" ON "Club"("name");

-- CreateIndex
CREATE INDEX "Club_lastActivityAt_idx" ON "Club"("lastActivityAt");

-- CreateIndex
CREATE INDEX "Club_memberCount_idx" ON "Club"("memberCount");

-- CreateIndex
CREATE INDEX "Club_createdById_idx" ON "Club"("createdById");

-- CreateIndex
CREATE INDEX "ClubMember_userId_idx" ON "ClubMember"("userId");

-- CreateIndex
CREATE INDEX "ClubMember_userId_status_idx" ON "ClubMember"("userId", "status");

-- CreateIndex
CREATE INDEX "ClubMember_clubId_status_idx" ON "ClubMember"("clubId", "status");

-- CreateIndex
CREATE INDEX "ClubMember_clubId_role_idx" ON "ClubMember"("clubId", "role");

-- CreateIndex
CREATE INDEX "ClubMember_clubId_role_status_idx" ON "ClubMember"("clubId", "role", "status");

-- CreateIndex
CREATE INDEX "ClubMember_role_idx" ON "ClubMember"("role");

-- CreateIndex
CREATE INDEX "ClubPrompt_clubId_status_idx" ON "ClubPrompt"("clubId", "status");

-- CreateIndex
CREATE INDEX "ClubPrompt_authorId_idx" ON "ClubPrompt"("authorId");

-- CreateIndex
CREATE INDEX "ClubPrompt_expiresAt_idx" ON "ClubPrompt"("expiresAt");

-- CreateIndex
CREATE INDEX "ClubPrompt_publishedAt_idx" ON "ClubPrompt"("publishedAt");

-- CreateIndex
CREATE INDEX "ClubPrompt_isPinned_idx" ON "ClubPrompt"("isPinned");

-- AddForeignKey
ALTER TABLE "ClubInvite" ADD CONSTRAINT "ClubInvite_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubInvite" ADD CONSTRAINT "ClubInvite_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubInvite" ADD CONSTRAINT "ClubInvite_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubJoinRequest" ADD CONSTRAINT "ClubJoinRequest_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubJoinRequest" ADD CONSTRAINT "ClubJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPromptResponse" ADD CONSTRAINT "ClubPromptResponse_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPromptResponse" ADD CONSTRAINT "ClubPromptResponse_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "ClubPrompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPromptResponse" ADD CONSTRAINT "ClubPromptResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPromptResponse" ADD CONSTRAINT "ClubPromptResponse_dareProofId_fkey" FOREIGN KEY ("dareProofId") REFERENCES "DareProof"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPromptComment" ADD CONSTRAINT "ClubPromptComment_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPromptComment" ADD CONSTRAINT "ClubPromptComment_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "ClubPrompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPromptComment" ADD CONSTRAINT "ClubPromptComment_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "ClubPromptResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPromptComment" ADD CONSTRAINT "ClubPromptComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPromptComment" ADD CONSTRAINT "ClubPromptComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ClubPromptComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubAuditLog" ADD CONSTRAINT "ClubAuditLog_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
