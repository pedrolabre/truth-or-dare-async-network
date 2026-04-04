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