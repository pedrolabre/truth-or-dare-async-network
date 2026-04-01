-- CreateEnum
CREATE TYPE "ClubPromptType" AS ENUM ('truth', 'dare');

-- CreateTable
CREATE TABLE "Truth" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Truth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dare" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubMember" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubPrompt" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "ClubPromptType" NOT NULL,
    "content" TEXT NOT NULL,
    "maxAttempts" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClubMember_clubId_userId_key" ON "ClubMember"("clubId", "userId");

-- AddForeignKey
ALTER TABLE "Truth" ADD CONSTRAINT "Truth_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dare" ADD CONSTRAINT "Dare_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPrompt" ADD CONSTRAINT "ClubPrompt_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPrompt" ADD CONSTRAINT "ClubPrompt_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
