-- CreateEnum
CREATE TYPE "LikeTargetType" AS ENUM ('truth', 'dare', 'club');

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" "LikeTargetType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Like_targetId_targetType_idx" ON "Like"("targetId", "targetType");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_targetId_targetType_key" ON "Like"("userId", "targetId", "targetType");

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
