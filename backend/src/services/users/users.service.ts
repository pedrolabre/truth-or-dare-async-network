import bcrypt from 'bcrypt';
import {
  ClubMemberStatus,
  ClubPromptStatus,
  ClubStatus,
  ClubVisibility,
} from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import {
  canViewPrivateUserProfile,
  PRIVATE_PROFILE_LABEL,
  PRIVATE_PROFILE_NAME,
} from '../search/privacy';
import {
  invalidCurrentPasswordError,
  userNotFoundError,
  usernameAlreadyInUseError,
  validationError,
} from './settings.errors';
import {
  type DeleteMyAccountInput,
  type UpdateMyAccountInput,
  requireDeleteAccountCurrentPassword,
  validateMyAccountUpdate,
} from './settings.validators';
import { normalizeOptionalMediaUrl } from '../uploads/media-url';
import { sendAccountSecurityEmail } from '../auth/email.service';

type ListUsersInput = {
  currentUserId: string;
  query?: string;
};

async function sendAccountSecurityEmailSafely(input: {
  to: string;
  subject: string;
  title: string;
  body: string;
  userId: string;
  event: string;
}): Promise<void> {
  try {
    const emailResult = await sendAccountSecurityEmail(input);

    if (!emailResult.ok) {
      console.warn('Account security email failed', {
        userId: input.userId,
        event: input.event,
        reason: emailResult.reason,
      });
    }
  } catch (error) {
    console.warn('Account security email failed', {
      userId: input.userId,
      event: input.event,
      reason: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

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
  avatarUrl: string | null;
  isPrivate: boolean;
  createdAt: Date;
  createdTruthsCount: number;
  createdDaresCount: number;
  stats: {
    createdTruthsCount: number;
    createdDaresCount: number;
    activePublicClubsCount: number;
    publishedClubPromptsCount: number;
  };
};

export type PublicUserProfile = {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  level: number | null;
  levelLabel: string;
  stats: {
    createdTruthsCount: number;
    createdDaresCount: number;
    activePublicClubsCount: number;
    publishedClubPromptsCount: number;
  };
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
      deletedAt: null,
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
    userNotFoundError();
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
      avatarUrl: true,
      isPrivate: true,
      createdAt: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) {
    userNotFoundError();
  }

  const [
    createdTruthsCount,
    createdDaresCount,
    activePublicClubsCount,
    publishedClubPromptsCount,
  ] = await Promise.all([
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
    prisma.clubMember.count({
      where: {
        userId,
        status: ClubMemberStatus.active,
        club: {
          visibility: ClubVisibility.public,
          status: ClubStatus.active,
          deletedAt: null,
        },
      },
    }),
    prisma.clubPrompt.count({
      where: {
        authorId: userId,
        status: ClubPromptStatus.published,
        archivedAt: null,
        removedAt: null,
        club: {
          visibility: ClubVisibility.public,
          status: ClubStatus.active,
          deletedAt: null,
        },
      },
    }),
  ]);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    isPrivate: user.isPrivate,
    createdAt: user.createdAt,
    createdTruthsCount,
    createdDaresCount,
    stats: {
      createdTruthsCount,
      createdDaresCount,
      activePublicClubsCount,
      publishedClubPromptsCount,
    },
  };
}

function getRestrictedPublicProfile(userId: string): PublicUserProfile {
  return {
    id: userId,
    name: PRIVATE_PROFILE_NAME,
    username: null,
    bio: null,
    avatarUrl: null,
    level: null,
    levelLabel: PRIVATE_PROFILE_LABEL,
    stats: {
      createdTruthsCount: 0,
      createdDaresCount: 0,
      activePublicClubsCount: 0,
      publishedClubPromptsCount: 0,
    },
  };
}

export async function getPublicUserProfile(
  userId: string,
  viewerId?: string | null,
): Promise<PublicUserProfile> {
  if (!userId) {
    throw new Error('Usuario nao encontrado');
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      avatarUrl: true,
      isPrivate: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) {
    throw new Error('Usuario nao encontrado');
  }

  if (
    user.isPrivate &&
    !(await canViewPrivateUserProfile({
      viewerId,
      targetUserId: user.id,
    }))
  ) {
    return getRestrictedPublicProfile(user.id);
  }

  const [
    createdTruthsCount,
    createdDaresCount,
    activePublicClubsCount,
    publishedClubPromptsCount,
  ] = await Promise.all([
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
    prisma.clubMember.count({
      where: {
        userId,
        status: ClubMemberStatus.active,
        club: {
          visibility: ClubVisibility.public,
          status: ClubStatus.active,
          deletedAt: null,
        },
      },
    }),
    prisma.clubPrompt.count({
      where: {
        authorId: userId,
        status: ClubPromptStatus.published,
        archivedAt: null,
        removedAt: null,
        club: {
          visibility: ClubVisibility.public,
          status: ClubStatus.active,
          deletedAt: null,
        },
      },
    }),
  ]);

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    level: null,
    levelLabel: 'Nivel indisponivel',
    stats: {
      createdTruthsCount,
      createdDaresCount,
      activePublicClubsCount,
      publishedClubPromptsCount,
    },
  };
}

type UpdateMyProfileInput = {
  name?: string;
  username?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
};

export async function updateMyProfile(
  userId: string,
  data: UpdateMyProfileInput,
): Promise<MyProfile> {
  if (!userId) {
    throw new Error('Usuário autenticado não encontrado');
  }

  const { name, username, bio, avatarUrl } = data;

  const updateData: {
    name?: string;
    username?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
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

  if (avatarUrl !== undefined) {
    const normalizedAvatarUrl = normalizeOptionalMediaUrl(
      avatarUrl,
      'avatarUrl',
      validationError,
    );

    if (normalizedAvatarUrl !== undefined) {
      updateData.avatarUrl = normalizedAvatarUrl;
    }
  }

  if (
    updateData.name === undefined &&
    updateData.username === undefined &&
    updateData.bio === undefined &&
    updateData.avatarUrl === undefined
  ) {
    throw new Error('Nenhum campo válido para atualização');
  }

  try {
    const updateResult = await prisma.user.updateMany({
      where: {
        id: userId,
        deletedAt: null,
      },
      data: updateData,
    });

    if (updateResult.count === 0) {
      throw new Error('Usuário não encontrado');
    }
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      throw new Error('Username já está em uso');
    }

    throw error;
  }

  return getMyProfile(userId);
}

export async function updateMyAccount(
  userId: string,
  data: UpdateMyAccountInput,
): Promise<MyProfile> {
  if (!userId) {
    userNotFoundError();
  }

  const updateData = validateMyAccountUpdate(data);

  try {
    const updateResult = await prisma.user.updateMany({
      where: {
        id: userId,
        deletedAt: null,
      },
      data: updateData,
    });

    if (updateResult.count === 0) {
      userNotFoundError();
    }
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      usernameAlreadyInUseError();
    }

    if (error.code === 'P2025') {
      userNotFoundError();
    }

    throw error;
  }

  return getMyProfile(userId);
}

export async function deleteMyAccount(
  userId: string,
  data: DeleteMyAccountInput,
) {
  if (!userId) {
    userNotFoundError();
  }

  const currentPassword = requireDeleteAccountCurrentPassword(data);

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) {
    userNotFoundError();
  }

  const passwordMatches = await bcrypt.compare(
    currentPassword,
    user.passwordHash,
  );

  if (!passwordMatches) {
    invalidCurrentPasswordError();
  }

  try {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      userNotFoundError();
    }

    throw error;
  }

  await sendAccountSecurityEmailSafely({
    to: user.email,
    subject: 'Conta excluida',
    title: 'Conta excluida',
    body: 'Sua conta foi marcada como excluida com sucesso.',
    userId: user.id,
    event: 'account_deleted',
  });

  return {
    ok: true,
  };
}
