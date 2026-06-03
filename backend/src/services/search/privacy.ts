import {
  ClubMemberStatus,
  ClubStatus,
  ClubVisibility,
  Prisma,
} from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';

export const PRIVATE_PROFILE_NAME = 'Perfil privado';
export const PRIVATE_PROFILE_LABEL = 'Perfil privado';

const activeClubWhere = {
  status: ClubStatus.active,
  deletedAt: null,
} satisfies Prisma.ClubWhereInput;

export function buildVisibleUserWhere(viewerId: string): Prisma.UserWhereInput {
  return {
    deletedAt: null,
    OR: [
      {
        isPrivate: false,
      },
      {
        id: viewerId,
      },
      {
        clubMemberships: {
          some: {
            status: ClubMemberStatus.active,
            club: {
              ...activeClubWhere,
              members: {
                some: {
                  userId: viewerId,
                  status: ClubMemberStatus.active,
                },
              },
            },
          },
        },
      },
    ],
  };
}

export function buildSearchVisibleClubWhere(
  viewerId: string,
  options: { publicOnly?: boolean } = {},
): Prisma.ClubWhereInput {
  return {
    ...activeClubWhere,
    members: {
      none: {
        userId: viewerId,
        status: ClubMemberStatus.blocked,
      },
    },
    ...(options.publicOnly
      ? {
          visibility: ClubVisibility.public,
        }
      : {
          OR: [
            {
              visibility: ClubVisibility.public,
            },
            {
              members: {
                some: {
                  userId: viewerId,
                  status: ClubMemberStatus.active,
                },
              },
            },
          ],
        }),
  };
}

export function buildVisibleClubContentClubWhere(
  viewerId: string,
): Prisma.ClubWhereInput {
  return {
    ...activeClubWhere,
    members: {
      none: {
        userId: viewerId,
        status: ClubMemberStatus.blocked,
      },
    },
    OR: [
      {
        visibility: ClubVisibility.public,
      },
      {
        members: {
          some: {
            userId: viewerId,
            status: ClubMemberStatus.active,
          },
        },
      },
    ],
  };
}

export function buildVisibleClubPromptAccessWhere(
  viewerId: string,
): Prisma.ClubPromptWhereInput {
  return {
    AND: [
      {
        club: buildVisibleClubContentClubWhere(viewerId),
      },
      {
        OR: [
          {
            club: {
              members: {
                some: {
                  userId: viewerId,
                  status: ClubMemberStatus.active,
                },
              },
            },
          },
          {
            isMembersOnly: false,
            club: {
              visibility: ClubVisibility.public,
            },
          },
        ],
      },
    ],
  };
}

export async function canViewPrivateUserProfile({
  viewerId,
  targetUserId,
}: {
  viewerId?: string | null;
  targetUserId: string;
}) {
  if (!viewerId) {
    return false;
  }

  if (viewerId === targetUserId) {
    return true;
  }

  const sharedMembership = await prisma.clubMember.findFirst({
    where: {
      userId: targetUserId,
      status: ClubMemberStatus.active,
      club: {
        ...activeClubWhere,
        members: {
          some: {
            userId: viewerId,
            status: ClubMemberStatus.active,
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(sharedMembership);
}

export function canViewClubPrivacyRecord({
  viewerId,
  club,
}: {
  viewerId: string;
  club: {
    visibility: ClubVisibility;
    status: ClubStatus;
    deletedAt: Date | null;
    members: Array<{ userId?: string; status: ClubMemberStatus }>;
  };
}) {
  if (club.status !== ClubStatus.active || club.deletedAt) {
    return false;
  }

  if (club.visibility === ClubVisibility.public) {
    return true;
  }

  return club.members.some(
    (member) =>
      (!member.userId || member.userId === viewerId) &&
      member.status === ClubMemberStatus.active,
  );
}
