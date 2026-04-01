import { prisma } from '../lib/prisma';

export type CreateTruthInput = {
  authorId: string;
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
};

export async function createTruth({
  authorId,
  content,
}: CreateTruthInput): Promise<CreatedTruthResponse> {
  const normalizedContent = content.trim();

  if (!authorId) {
    throw new Error('Usuário autenticado não encontrado');
  }

  if (!normalizedContent) {
    throw new Error('Conteúdo é obrigatório');
  }

  const truth = await prisma.truth.create({
    data: {
      authorId,
      content: normalizedContent,
    },
    include: {
      author: {
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
  };
}