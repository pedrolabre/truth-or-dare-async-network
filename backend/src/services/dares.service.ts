import { prisma } from '../lib/prisma';

type CreateDareInput = {
  content: string;
  authorId: string;
  targetUserId: string;
  maxAttempts?: number;
  expiresAt?: string | null;
};

export async function createDare({
  content,
  authorId,
  targetUserId,
  maxAttempts,
  expiresAt,
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

  const normalizedMaxAttempts =
    maxAttempts === undefined ? 5 : Number(maxAttempts);

  if (
    !Number.isInteger(normalizedMaxAttempts) ||
    normalizedMaxAttempts <= 0
  ) {
    throw new Error('maxAttempts must be a positive integer');
  }

  let normalizedExpiresAt: Date | null;

  if (expiresAt === undefined) {
    normalizedExpiresAt = new Date(Date.now() + 1000 * 60 * 60);
  } else if (expiresAt === null) {
    normalizedExpiresAt = null;
  } else {
    const parsedExpiresAt = new Date(expiresAt);

    if (Number.isNaN(parsedExpiresAt.getTime())) {
      throw new Error('expiresAt must be a valid date');
    }

    normalizedExpiresAt = parsedExpiresAt;
  }

  const dare = await prisma.dare.create({
    data: {
      content: normalizedContent,
      authorId,
      targetUserId,
      maxAttempts: normalizedMaxAttempts,
      expiresAt: normalizedExpiresAt,
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

type DeleteDareServiceInput = {
  dareId: string;
  userId: string;
};

export async function deleteDareService({
  dareId,
  userId,
}: DeleteDareServiceInput) {
  if (!dareId) {
    throw new Error('Dare não encontrado');
  }

  if (!userId) {
    throw new Error('Não autorizado');
  }

  const dare = await prisma.dare.findUnique({
    where: {
      id: dareId,
    },
  });

  if (!dare) {
    throw new Error('Dare não encontrado');
  }

  if (dare.authorId !== userId) {
    throw new Error('Não autorizado');
  }

  await prisma.dare.delete({
    where: {
      id: dareId,
    },
  });
}