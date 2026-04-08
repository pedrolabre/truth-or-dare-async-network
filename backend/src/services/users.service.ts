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
  username: string | null;
  bio: string | null;
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
      username: true,
      bio: true,
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
    username: user.username,
    bio: user.bio,
    createdTruthsCount,
    createdDaresCount,
  };
}

type UpdateMyProfileInput = {
  name?: string;
  username?: string | null;
  bio?: string | null;
};

export async function updateMyProfile(
  userId: string,
  data: UpdateMyProfileInput,
): Promise<MyProfile> {
  if (!userId) {
    throw new Error('Usuário autenticado não encontrado');
  }

  const { name, username, bio } = data;

  const updateData: {
    name?: string;
    username?: string | null;
    bio?: string | null;
  } = {};

  if (typeof name === 'string') {
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new Error('Nome inválido');
    }

    updateData.name = trimmedName;
  }

  if (typeof username === 'string') {
    const trimmedUsername = username.trim();

    updateData.username = trimmedUsername || null;
  }

  if (typeof bio === 'string') {
    const trimmedBio = bio.trim();

    updateData.bio = trimmedBio || null;
  }

if (
    updateData.name === undefined &&
    updateData.username === undefined &&
    updateData.bio === undefined
  ) {
    throw new Error('Nenhum campo válido para atualização');
  }

  try {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
    });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      throw new Error('Username já está em uso');
    }

    throw error;
  }

  return getMyProfile(userId);
}