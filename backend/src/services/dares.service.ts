import { prisma } from '../lib/prisma';

type CreateDareInput = {
  content: string;
  authorId: string;
  targetUserId: string;
};

export async function createDare({
  content,
  authorId,
  targetUserId,
}: CreateDareInput) {
  if (!authorId) {
    throw new Error('authorId is required');
  }

  if (!targetUserId) {
    throw new Error('targetUserId is required');
  }

  if (!content || !content.trim()) {
    throw new Error('content is required');
  }

  const normalizedContent = content.trim();

  const dare = await prisma.dare.create({
    data: {
      content: normalizedContent,
      authorId,
      targetUserId,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      targetUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return dare;
}