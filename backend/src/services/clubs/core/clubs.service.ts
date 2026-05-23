import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubStatus,
  ClubVisibility,
  Prisma,
} from '../../../generated/prisma/client';
import { ClubDetailsDto, ClubSummaryDto } from '../../../dtos/clubs.dto';
import { prisma } from '../../../lib/prisma';
import {
  duplicateSlugError,
  notFoundError,
  requireAuthenticatedUser,
  validationError,
} from './errors';
import { mapDetails, mapSummary } from './mappers';
import {
  ensureCanArchiveClub,
  ensureCanEditClub,
  ensureCanViewClub,
} from './permissions';
import { getClubWithMembers } from './repository';
import { resolveUniqueSlug } from './slug';
import {
  ClubMemberWithClub,
  CreateClubInput,
  DiscoverClubsResult,
  UpdateClubInput,
} from './types';
import {
  CLUB_DESCRIPTION_MAX_LENGTH,
  CLUB_RULES_MAX_LENGTH,
  normalizeBlockedWords,
  normalizeIconName,
  normalizeInitialMemberIds,
  normalizeName,
  normalizeOptionalText,
  normalizeTags,
  normalizeVisibility,
} from './validators';
import { enforceClubRateLimit } from '../rate-limit.service';

export { ClubServiceError } from './errors';
export type { ClubErrorCode } from './errors';
export type {
  CreateClubInput,
  DiscoverClubsResult,
  UpdateClubInput,
} from './types';

async function assertInitialMembersExist(memberIds: string[]) {
  if (memberIds.length === 0) {
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: memberIds,
      },
    },
    select: {
      id: true,
    },
  });

  if (users.length !== memberIds.length) {
    validationError('Um ou mais membros iniciais nao existem');
  }
}

export async function createClub(input: CreateClubInput): Promise<ClubDetailsDto> {
  requireAuthenticatedUser(input.creatorId);
  await enforceClubRateLimit({
    action: 'create_club',
    actorId: input.creatorId,
  });

  const name = normalizeName(input.name);
  const description = normalizeOptionalText(
    input.description,
    'Descricao',
    CLUB_DESCRIPTION_MAX_LENGTH,
  );
  const iconName = normalizeIconName(input.iconName);
  const visibility = normalizeVisibility(input.visibility);
  const rules = normalizeOptionalText(input.rules, 'Regras', CLUB_RULES_MAX_LENGTH);
  const initialMemberIds = normalizeInitialMemberIds(
    input.initialMemberIds,
    input.creatorId,
  );
  const tags = normalizeTags(input.tags);

  await assertInitialMembersExist(initialMemberIds);

  const now = new Date();
  const slug = await resolveUniqueSlug(name);
  const memberCount = initialMemberIds.length + 1;

  try {
    const createdClub = await prisma.$transaction(async (tx) => {
      const club = await tx.club.create({
        data: {
          name,
          slug,
          description,
          iconName,
          visibility,
          rules,
          tags,
          memberCount,
          promptCount: 0,
          lastActivityAt: now,
          createdById: input.creatorId,
          members: {
            create: [
              {
                userId: input.creatorId,
                role: ClubMemberRole.owner,
                status: ClubMemberStatus.active,
                joinedAt: now,
              },
              ...initialMemberIds.map((userId) => ({
                userId,
                role: ClubMemberRole.member,
                status: ClubMemberStatus.active,
                invitedById: input.creatorId,
                joinedAt: now,
              })),
            ],
          },
        },
      });

      await tx.clubAuditLog.createMany({
        data: [
          {
            clubId: club.id,
            actorId: input.creatorId,
            action: 'club_created',
            entityType: 'club',
            entityId: club.id,
            metadata: {
              visibility,
              initialMemberCount: initialMemberIds.length,
            },
          },
          ...initialMemberIds.map((targetUserId) => ({
            clubId: club.id,
            actorId: input.creatorId,
            targetUserId,
            action: 'member_added',
            entityType: 'club_member',
            metadata: {
              status: ClubMemberStatus.active,
              role: ClubMemberRole.member,
            },
          })),
        ],
      });

      return club;
    });

    return getClubDetails({
      clubId: createdClub.id,
      userId: input.creatorId,
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      duplicateSlugError();
    }

    throw error;
  }
}

export async function listMyClubs(userId: string): Promise<ClubSummaryDto[]> {
  requireAuthenticatedUser(userId);

  const memberships = await prisma.clubMember.findMany({
    where: {
      userId,
      status: {
        in: [ClubMemberStatus.active, ClubMemberStatus.invited],
      },
      club: {
        status: {
          not: ClubStatus.deleted,
        },
        deletedAt: null,
      },
    },
    include: {
      club: {
        include: {
          members: true,
        },
      },
    },
    orderBy: {
      club: {
        lastActivityAt: 'desc',
      },
    },
  });

  return memberships.map((membership: ClubMemberWithClub) =>
    mapSummary(membership.club, userId),
  );
}

export async function discoverClubs(userId: string): Promise<DiscoverClubsResult> {
  requireAuthenticatedUser(userId);

  const where = {
    visibility: ClubVisibility.public,
    status: ClubStatus.active,
    deletedAt: null,
    members: {
      none: {
        userId,
        status: ClubMemberStatus.blocked,
      },
    },
  };

  const [suggested, popular, recent] = await Promise.all([
    prisma.club.findMany({
      where: {
        ...where,
        AND: [
          {
            members: {
              none: {
                userId,
                status: ClubMemberStatus.active,
              },
            },
          },
        ],
      },
      include: {
        members: true,
      },
      orderBy: [{ lastActivityAt: 'desc' }, { memberCount: 'desc' }],
      take: 10,
    }),
    prisma.club.findMany({
      where,
      include: {
        members: true,
      },
      orderBy: [{ memberCount: 'desc' }, { lastActivityAt: 'desc' }],
      take: 10,
    }),
    prisma.club.findMany({
      where,
      include: {
        members: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    }),
  ]);

  return {
    suggested: suggested.map((club) => mapSummary(club, userId)),
    popular: popular.map((club) => mapSummary(club, userId)),
    recent: recent.map((club) => mapSummary(club, userId)),
  };
}

export async function searchClubs({
  userId,
  query,
}: {
  userId: string;
  query?: unknown;
}): Promise<ClubSummaryDto[]> {
  requireAuthenticatedUser(userId);

  if (typeof query !== 'string' || !query.trim()) {
    return [];
  }

  const normalizedQuery = query.trim();
  const normalizedTag = normalizedQuery.toLowerCase();

  const clubs = await prisma.club.findMany({
    where: {
      visibility: ClubVisibility.public,
      status: ClubStatus.active,
      deletedAt: null,
      members: {
        none: {
          userId,
          status: ClubMemberStatus.blocked,
        },
      },
      OR: [
        {
          name: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },
        {
          slug: {
            contains: normalizedTag,
            mode: 'insensitive',
          },
        },
        {
          tags: {
            has: normalizedTag,
          },
        },
      ],
    },
    include: {
      members: true,
    },
    orderBy: [{ memberCount: 'desc' }, { name: 'asc' }],
    take: 20,
  });

  return clubs.map((club) => mapSummary(club, userId));
}

export async function getClubDetails({
  clubId,
  userId,
}: {
  clubId: string;
  userId: string;
}): Promise<ClubDetailsDto> {
  requireAuthenticatedUser(userId);

  if (!clubId) {
    notFoundError();
  }

  const club = await getClubWithMembers(clubId);

  ensureCanViewClub(club, userId);

  return mapDetails(club, userId);
}

export async function updateClub(input: UpdateClubInput): Promise<ClubDetailsDto> {
  requireAuthenticatedUser(input.userId);

  const club = await getClubWithMembers(input.clubId);
  ensureCanEditClub(club, input.userId);

  const data: Prisma.ClubUpdateInput = {};

  if (input.name !== undefined) {
    data.name = normalizeName(input.name);
  }

  if (input.description !== undefined) {
    data.description = normalizeOptionalText(
      input.description,
      'Descricao',
      CLUB_DESCRIPTION_MAX_LENGTH,
    );
  }

  if (input.iconName !== undefined) {
    data.iconName = normalizeIconName(input.iconName);
  }

  if (input.visibility !== undefined) {
    data.visibility = normalizeVisibility(input.visibility);
  }

  if (input.rules !== undefined) {
    data.rules = normalizeOptionalText(
      input.rules,
      'Regras',
      CLUB_RULES_MAX_LENGTH,
    );
  }

  if (input.blockedWords !== undefined) {
    data.blockedWords = normalizeBlockedWords(input.blockedWords);
  }

  if (input.tags !== undefined) {
    data.tags = normalizeTags(input.tags);
  }

  if (Object.keys(data).length === 0) {
    validationError('Nenhum campo valido para atualizar');
  }

  const updatedClub = await prisma.$transaction(async (tx) => {
    const updated = await tx.club.update({
      where: {
        id: input.clubId,
      },
      data,
    });

    await tx.clubAuditLog.create({
      data: {
        clubId: input.clubId,
        actorId: input.userId,
        action: 'club_updated',
        entityType: 'club',
        entityId: input.clubId,
        metadata: {
          fields: Object.keys(data),
        },
      },
    });

    return updated;
  });

  return getClubDetails({
    clubId: updatedClub.id,
    userId: input.userId,
  });
}

export async function archiveClub({
  clubId,
  userId,
}: {
  clubId: string;
  userId: string;
}) {
  requireAuthenticatedUser(userId);

  const club = await getClubWithMembers(clubId);
  ensureCanArchiveClub(club, userId);

  const now = new Date();

  await prisma.$transaction([
    prisma.club.update({
      where: {
        id: clubId,
      },
      data: {
        status: ClubStatus.archived,
        archivedAt: now,
      },
    }),
    prisma.clubAuditLog.create({
      data: {
        clubId,
        actorId: userId,
        action: 'club_archived',
        entityType: 'club',
        entityId: clubId,
      },
    }),
  ]);
}

export async function restoreClub({
  clubId,
  userId,
}: {
  clubId: string;
  userId: string;
}): Promise<ClubDetailsDto> {
  requireAuthenticatedUser(userId);

  const club = await getClubWithMembers(clubId);
  ensureCanArchiveClub(club, userId);

  if (club.status !== ClubStatus.archived) {
    validationError('Apenas clubes arquivados podem ser restaurados');
  }

  const restoredClub = await prisma.$transaction(async (tx) => {
    const updated = await tx.club.update({
      where: {
        id: clubId,
      },
      data: {
        status: ClubStatus.active,
        archivedAt: null,
      },
    });

    await tx.clubAuditLog.create({
      data: {
        clubId,
        actorId: userId,
        action: 'club_restored',
        entityType: 'club',
        entityId: clubId,
      },
    });

    return updated;
  });

  return getClubDetails({
    clubId: restoredClub.id,
    userId,
  });
}
