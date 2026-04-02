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