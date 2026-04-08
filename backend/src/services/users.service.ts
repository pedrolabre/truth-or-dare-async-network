import { prisma } from '../lib/prisma';

type ListUsersInput = {
  currentUserId: string;
  query?: string;
};

export type UserPickerItem = {
  id: string;
  name: string;
  email: string;
};

export type MyProfile = {
  id: string;
  name: string;
  email: string;
  createdTruthsCount: number;
  createdDaresCount: number;
};

export async function listUsersForChallenge({
  currentUserId,
  query,
}: ListUsersInput): Promise<UserPickerItem[]> {
  if (!currentUserId) {
    throw new Error('Usuário autenticado não encontrado');
  }

  const normalizedQuery = query?.trim();

  return prisma.user.findMany({
    where: {
      id: {
        not: currentUserId,
      },
      ...(normalizedQuery
        ? {
            OR: [
              {
                name: {
                  contains: normalizedQuery,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: normalizedQuery,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: 'asc',
    },
    take: 20,
  });
}

export async function getMyProfile(userId: string): Promise<MyProfile> {
  if (!userId) {
    throw new Error('Usuário autenticado não encontrado');
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const [createdTruthsCount, createdDaresCount] = await Promise.all([
    prisma.truth.count({
      where: {
        authorId: userId,
      },
    }),
    prisma.dare.count({
      where: {
        authorId: userId,
      },
    }),
  ]);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdTruthsCount,
    createdDaresCount,
  };
}