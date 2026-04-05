import { LikeTargetType } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';

type ToggleLikeInput = {
  userId: string;
  targetId: string;
  targetType: LikeTargetType;
};

export async function toggleLike({
  userId,
  targetId,
  targetType,
}: ToggleLikeInput) {
  if (!userId) {
    throw new Error('Não autorizado');
  }

  if (!targetId || !targetType) {
    throw new Error('Dados inválidos');
  }

  const existingLike = await prisma.like.findUnique({
    where: {
      userId_targetId_targetType: {
        userId,
        targetId,
        targetType,
      },
    },
  });

  if (existingLike) {
    await prisma.like.delete({
      where: { id: existingLike.id },
    });

    return { liked: false };
  }

  await prisma.like.create({
    data: {
      userId,
      targetId,
      targetType,
    },
  });

  return { liked: true };
}

export async function getLikesCount(
  targetId: string,
  targetType: LikeTargetType,
) {
  return prisma.like.count({
    where: { targetId, targetType },
  });
}

export async function isLikedByUser(
  userId: string,
  targetId: string,
  targetType: LikeTargetType,
) {
  const like = await prisma.like.findUnique({
    where: {
      userId_targetId_targetType: {
        userId,
        targetId,
        targetType,
      },
    },
  });

  return !!like;
}