import {
  ClubMemberRole,
  ClubMemberStatus,
  Prisma,
} from '../generated/prisma/client';
import { ClubMemberSummaryDto } from '../dtos/clubs.dto';
import { prisma } from '../lib/prisma';
import { requireAuthenticatedUser, validationError } from './clubs.errors';
import { mapClubMember } from './clubs.members.mappers';
import { ensureCanViewClub } from './clubs.permissions';
import { getClubWithMembers } from './clubs.repository';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export type ListClubMembersInput = {
  clubId: string;
  userId: string;
  page?: unknown;
  limit?: unknown;
  role?: unknown;
  status?: unknown;
  search?: unknown;
};

export type ListClubMembersResult = {
  items: ClubMemberSummaryDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function firstQueryValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizePositiveInteger(
  value: unknown,
  defaultValue: number,
  fieldName: string,
) {
  const rawValue = firstQueryValue(value);

  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return defaultValue;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed < 1) {
    validationError(`${fieldName} deve ser um numero inteiro positivo`);
  }

  return parsed;
}

function normalizeLimit(value: unknown) {
  return Math.min(
    normalizePositiveInteger(value, DEFAULT_LIMIT, 'Limit'),
    MAX_LIMIT,
  );
}

function normalizeRole(value: unknown) {
  const role = firstQueryValue(value);

  if (role === undefined || role === null || role === '') {
    return undefined;
  }

  if (
    role !== ClubMemberRole.owner &&
    role !== ClubMemberRole.admin &&
    role !== ClubMemberRole.moderator &&
    role !== ClubMemberRole.member
  ) {
    validationError('Papel de membro invalido');
  }

  return role;
}

function normalizeStatus(value: unknown) {
  const status = firstQueryValue(value);

  if (status === undefined || status === null || status === '') {
    return undefined;
  }

  if (
    status !== ClubMemberStatus.active &&
    status !== ClubMemberStatus.invited &&
    status !== ClubMemberStatus.requested &&
    status !== ClubMemberStatus.removed
  ) {
    validationError('Status de membro invalido');
  }

  return status;
}

function normalizeSearch(value: unknown) {
  const search = firstQueryValue(value);

  if (search === undefined || search === null || search === '') {
    return undefined;
  }

  if (typeof search !== 'string') {
    validationError('Busca de membros invalida');
  }

  const normalizedSearch = search.trim();

  return normalizedSearch || undefined;
}

export async function listClubMembers(
  input: ListClubMembersInput,
): Promise<ListClubMembersResult> {
  requireAuthenticatedUser(input.userId);

  const club = await getClubWithMembers(input.clubId);
  ensureCanViewClub(club, input.userId);

  const page = normalizePositiveInteger(input.page, DEFAULT_PAGE, 'Page');
  const limit = normalizeLimit(input.limit);
  const role = normalizeRole(input.role);
  const status = normalizeStatus(input.status);
  const search = normalizeSearch(input.search);

  const where: Prisma.ClubMemberWhereInput = {
    clubId: input.clubId,
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          user: {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                username: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          },
        }
      : {}),
  };

  const [total, members] = await prisma.$transaction([
    prisma.clubMember.count({
      where,
    }),
    prisma.clubMember.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: [
        {
          role: 'asc',
        },
        {
          joinedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    items: members.map(mapClubMember),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
