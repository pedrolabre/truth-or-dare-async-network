import { LikeTargetType } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { createNotification } from '../notifications.service';

type ToggleLikeInput = {
  userId: string;
  targetId: string;
  targetType: LikeTargetType;
};

type LikeNotificationTarget = {
  recipientId: string;
  referenceType: string;
  referenceId: string;
  deepLink: string;
  title: string;
  body: string;
};

function truthCommentsDeepLink(truthId: string) {
  return `/feed-comments?itemId=${encodeURIComponent(truthId)}&itemType=truth`;
}

async function getLikeNotificationTarget(
  targetId: string,
  targetType: LikeTargetType,
): Promise<LikeNotificationTarget | null> {
  if (targetType === 'truth') {
    const truth = await prisma.truth.findUnique({
      where: {
        id: targetId,
      },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!truth) {
      return null;
    }

    return {
      recipientId: truth.authorId,
      referenceType: 'truth_like',
      referenceId: truth.id,
      deepLink: '/feed',
      title: 'Sua truth recebeu uma curtida',
      body: 'Alguem curtiu uma truth que voce enviou.',
    };
  }

  if (targetType === 'dare') {
    const dare = await prisma.dare.findUnique({
      where: {
        id: targetId,
      },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!dare) {
      return null;
    }

    return {
      recipientId: dare.authorId,
      referenceType: 'dare_like',
      referenceId: dare.id,
      deepLink: '/feed',
      title: 'Seu desafio recebeu uma curtida',
      body: 'Alguem curtiu um desafio que voce criou.',
    };
  }

  if (targetType === 'truth_comment') {
    const comment = await prisma.truthComment.findUnique({
      where: {
        id: targetId,
      },
      select: {
        id: true,
        userId: true,
        truthId: true,
      },
    });

    if (!comment) {
      return null;
    }

    return {
      recipientId: comment.userId,
      referenceType: 'truth_comment_like',
      referenceId: comment.id,
      deepLink: truthCommentsDeepLink(comment.truthId),
      title: 'Seu comentario recebeu uma curtida',
      body: 'Alguem curtiu seu comentario em uma truth.',
    };
  }

  return null;
}

async function emitLikeNotification({
  userId,
  targetId,
  targetType,
}: ToggleLikeInput) {
  const notificationTarget = await getLikeNotificationTarget(targetId, targetType);

  if (!notificationTarget) {
    return;
  }

  await createNotification({
    userId: notificationTarget.recipientId,
    actorId: userId,
    type: 'feed_like',
    title: notificationTarget.title,
    body: notificationTarget.body,
    deepLink: notificationTarget.deepLink,
    referenceType: notificationTarget.referenceType,
    referenceId: notificationTarget.referenceId,
    dedupeKey: `feed_like:${targetType}:${targetId}:${userId}`,
  });
}

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

    const likesCount = await prisma.like.count({
      where: {
        targetId,
        targetType,
      },
    });

    return {
      liked: false,
      likesCount,
    };
  }

  await prisma.like.create({
    data: {
      userId,
      targetId,
      targetType,
    },
  });

  await emitLikeNotification({
    userId,
    targetId,
    targetType,
  });

  const likesCount = await prisma.like.count({
    where: {
      targetId,
      targetType,
    },
  });

  return {
    liked: true,
    likesCount,
  };
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
