import { prisma } from '../lib/prisma';

export type CreateTruthInput = {
  authorId: string;
  targetUserId: string;
  content: string;
};

export type CreatedTruthResponse = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    email: string;
  };
  targetUser: {
    id: string;
    name: string;
    email: string;
  };
};

const TRUTH_COMMENT_MAX_LENGTH = 500;

type TruthCommentAuthorResponse = {
  id: string;
  name: string;
  email: string;
};

type TruthCommentReplyResponse = {
  id: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  likedByMe: boolean;
  canEdit: boolean;
  canDelete: boolean;
  author: TruthCommentAuthorResponse;
};

export type TruthCommentResponse = {
  id: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  likedByMe: boolean;
  canEdit: boolean;
  canDelete: boolean;
  author: TruthCommentAuthorResponse;
  replies: TruthCommentReplyResponse[];
};

type CreateTruthCommentInput = {
  truthId: string;
  userId: string;
  text: unknown;
  parentId?: string;
};

export async function createTruth({
  authorId,
  targetUserId,
  content,
}: CreateTruthInput): Promise<CreatedTruthResponse> {
  const normalizedContent = content.trim();

  if (!authorId) {
    throw new Error('Usuário autenticado não encontrado');
  }

  if (!targetUserId) {
    throw new Error('Usuário alvo é obrigatório');
  }

  if (!normalizedContent) {
    throw new Error('Conteúdo é obrigatório');
  }

  const truth = await prisma.truth.create({
    data: {
      content: normalizedContent,
      author: {
        connect: {
          id: authorId,
        },
      },
      targetUser: {
        connect: {
          id: targetUserId,
        },
      },
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

  return {
    id: truth.id,
    content: truth.content,
    createdAt: truth.createdAt,
    updatedAt: truth.updatedAt,
    author: truth.author,
    targetUser: truth.targetUser,
  };
}

type DeleteTruthServiceInput = {
  truthId: string;
  userId: string;
};

export async function deleteTruthService({
  truthId,
  userId,
}: DeleteTruthServiceInput) {
  if (!truthId) {
    throw new Error('Truth não encontrada');
  }

  if (!userId) {
    throw new Error('Não autorizado');
  }

  const truth = await prisma.truth.findUnique({
    where: {
      id: truthId,
    },
  });

  if (!truth) {
    throw new Error('Truth não encontrada');
  }

  if (truth.authorId !== userId) {
    throw new Error('Não autorizado');
  }

  await prisma.truth.delete({
    where: {
      id: truthId,
    },
  });
}

function validateTruthCommentText(text: unknown) {
  if (typeof text !== 'string') {
    throw new Error('Comentário é obrigatório');
  }

  const normalizedText = text.trim();

  if (!normalizedText) {
    throw new Error('Comentário é obrigatório');
  }

  if (normalizedText.length > TRUTH_COMMENT_MAX_LENGTH) {
    throw new Error(
      `Comentário deve ter no máximo ${TRUTH_COMMENT_MAX_LENGTH} caracteres`,
    );
  }

  return normalizedText;
}

async function getTruthCommentLikesData(commentIds: string[], userId: string) {
  if (commentIds.length === 0) {
    return {
      likesCountByCommentId: new Map<string, number>(),
      likedCommentIds: new Set<string>(),
    };
  }

  const likesCount = await prisma.like.groupBy({
    by: ['targetId'],
    where: {
      targetId: {
        in: commentIds,
      },
      targetType: 'truth_comment',
    },
    _count: {
      _all: true,
    },
  });

  const likedByUser = await prisma.like.findMany({
    where: {
      userId,
      targetId: {
        in: commentIds,
      },
      targetType: 'truth_comment',
    },
    select: {
      targetId: true,
    },
  });

  return {
    likesCountByCommentId: new Map(
      likesCount.map((item) => [item.targetId, item._count._all]),
    ),
    likedCommentIds: new Set(likedByUser.map((item) => item.targetId)),
  };
}

export async function getTruthCommentsService({
  truthId,
  userId,
}: {
  truthId: string;
  userId: string;
}): Promise<TruthCommentResponse[]> {
  if (!userId) {
    throw new Error('Não autorizado');
  }

  if (!truthId) {
    throw new Error('Truth não encontrada');
  }

  const truth = await prisma.truth.findUnique({
    where: {
      id: truthId,
    },
    select: {
      id: true,
    },
  });

  if (!truth) {
    throw new Error('Truth não encontrada');
  }

  const comments = await prisma.truthComment.findMany({
    where: {
      truthId,
      parentId: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      replies: {
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  const commentIds = comments.flatMap((comment) => [
    comment.id,
    ...comment.replies.map((reply) => reply.id),
  ]);

  const { likesCountByCommentId, likedCommentIds } =
    await getTruthCommentLikesData(commentIds, userId);

  return comments.map((comment) => ({
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    likesCount: likesCountByCommentId.get(comment.id) ?? 0,
    likedByMe: likedCommentIds.has(comment.id),
    canEdit: comment.user.id === userId,
    canDelete: comment.user.id === userId,
    author: comment.user,
    replies: comment.replies.map((reply) => ({
      id: reply.id,
      text: reply.text,
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
      likesCount: likesCountByCommentId.get(reply.id) ?? 0,
      likedByMe: likedCommentIds.has(reply.id),
      canEdit: reply.user.id === userId,
      canDelete: reply.user.id === userId,
      author: reply.user,
    })),
  }));
}

export async function createTruthCommentService({
  truthId,
  userId,
  text,
  parentId,
}: CreateTruthCommentInput): Promise<TruthCommentResponse> {
  if (!userId) {
    throw new Error('Não autorizado');
  }

  if (!truthId) {
    throw new Error('Truth não encontrada');
  }

  const normalizedText = validateTruthCommentText(text);

  const truth = await prisma.truth.findUnique({
    where: {
      id: truthId,
    },
    select: {
      id: true,
    },
  });

  if (!truth) {
    throw new Error('Truth não encontrada');
  }

  if (parentId) {
    const parentComment = await prisma.truthComment.findUnique({
      where: {
        id: parentId,
      },
      select: {
        id: true,
        truthId: true,
        parentId: true,
      },
    });

    if (!parentComment || parentComment.truthId !== truthId) {
      throw new Error('Comentário pai não encontrado');
    }

    if (parentComment.parentId) {
      throw new Error('Não é possível responder uma resposta');
    }
  }

  const comment = await prisma.truthComment.create({
    data: {
      text: normalizedText,
      truthId,
      userId,
      parentId: parentId || null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

    return {
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    likesCount: 0,
    likedByMe: false,
    canEdit: true,
    canDelete: true,
    author: comment.user,
    replies: [],
  };
}

type UpdateTruthCommentInput = {
  commentId: string;
  userId: string;
  text: unknown;
};

export async function updateTruthCommentService({
  commentId,
  userId,
  text,
}: UpdateTruthCommentInput): Promise<TruthCommentResponse> {
  if (!userId) {
    throw new Error('Não autorizado');
  }

  if (!commentId) {
    throw new Error('Comentário não encontrado');
  }

  const normalizedText = validateTruthCommentText(text);

  const existingComment = await prisma.truthComment.findUnique({
    where: {
      id: commentId,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!existingComment) {
    throw new Error('Comentário não encontrado');
  }

  if (existingComment.userId !== userId) {
    throw new Error('Não autorizado');
  }

  await prisma.truthComment.update({
    where: {
      id: commentId,
    },
    data: {
      text: normalizedText,
    },
  });

  const updatedComment = await prisma.truthComment.findUnique({
    where: {
      id: commentId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      replies: {
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!updatedComment) {
    throw new Error('Comentário não encontrado');
  }

  const commentIds = [
    updatedComment.id,
    ...updatedComment.replies.map((reply) => reply.id),
  ];

  const { likesCountByCommentId, likedCommentIds } =
    await getTruthCommentLikesData(commentIds, userId);

  return {
    id: updatedComment.id,
    text: updatedComment.text,
    createdAt: updatedComment.createdAt,
    updatedAt: updatedComment.updatedAt,
    likesCount: likesCountByCommentId.get(updatedComment.id) ?? 0,
    likedByMe: likedCommentIds.has(updatedComment.id),
    canEdit: updatedComment.user.id === userId,
    canDelete: updatedComment.user.id === userId,
    author: updatedComment.user,
    replies: updatedComment.replies.map((reply) => ({
      id: reply.id,
      text: reply.text,
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
      likesCount: likesCountByCommentId.get(reply.id) ?? 0,
      likedByMe: likedCommentIds.has(reply.id),
      canEdit: reply.user.id === userId,
      canDelete: reply.user.id === userId,
      author: reply.user,
    })),
  };
}

type DeleteTruthCommentInput = {
  commentId: string;
  userId: string;
};

export async function deleteTruthCommentService({
  commentId,
  userId,
}: DeleteTruthCommentInput) {
  if (!userId) {
    throw new Error('Não autorizado');
  }

  if (!commentId) {
    throw new Error('Comentário não encontrado');
  }

  const comment = await prisma.truthComment.findUnique({
    where: {
      id: commentId,
    },
    select: {
      id: true,
      userId: true,
      replies: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!comment) {
    throw new Error('Comentário não encontrado');
  }

  if (comment.userId !== userId) {
    throw new Error('Não autorizado');
  }

  const commentIdsToDelete = [
    comment.id,
    ...comment.replies.map((reply) => reply.id),
  ];

  await prisma.$transaction([
    prisma.like.deleteMany({
      where: {
        targetType: 'truth_comment',
        targetId: {
          in: commentIdsToDelete,
        },
      },
    }),
    prisma.truthComment.delete({
      where: {
        id: comment.id,
      },
    }),
  ]);
}