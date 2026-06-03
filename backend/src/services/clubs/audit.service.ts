import { Prisma } from '../../generated/prisma/client';
import {
  ClubAuditLogDto,
  ClubAuditMetadataDto,
  ListClubAuditLogsResponseDto,
} from '../../dtos/clubs.dto';
import { prisma } from '../../lib/prisma';
import {
  buildCursorPaginationResult,
  getCursorPaginationArgs,
  normalizeCursorPagination,
} from '../pagination';
import { requireAuthenticatedUser, validationError } from './core/errors';
import { getClubWithMembers } from './core/repository';
import { ensureCanViewClubAuditLogs } from './core/permissions';

type ListClubAuditLogsInput = {
  clubId: string;
  viewerId: string;
  limit?: unknown;
  cursor?: unknown;
  action?: unknown;
  targetUserId?: unknown;
  entityType?: unknown;
  from?: unknown;
  to?: unknown;
};

const AUDIT_DEFAULT_LIMIT = 20;
const AUDIT_MAX_LIMIT = 50;
const MAX_METADATA_ARRAY_LENGTH = 20;
const MAX_METADATA_DEPTH = 4;
const SENSITIVE_METADATA_KEY_PATTERN =
  /(authorization|password|passwordHash|resetToken|token|secret|email|code|raw|payload)/i;

const clubAuditLogSelect = {
  id: true,
  action: true,
  actorId: true,
  targetUserId: true,
  entityType: true,
  entityId: true,
  metadata: true,
  createdAt: true,
} satisfies Prisma.ClubAuditLogSelect;

function normalizeStringFilter(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();

  return normalized || undefined;
}

function normalizeDateFilter(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    validationError(`Filtro ${fieldName} da auditoria invalido`);
  }

  return date;
}

function buildCreatedAtFilter(from?: Date, to?: Date) {
  if (from && to && from.getTime() > to.getTime()) {
    validationError('Intervalo de auditoria invalido');
  }

  if (!from && !to) {
    return undefined;
  }

  return {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };
}

function sanitizeMetadataValue(
  value: Prisma.JsonValue | undefined,
  depth = 0,
): ClubAuditMetadataDto {
  if (value === undefined || value === null) {
    return null;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (depth >= MAX_METADATA_DEPTH) {
    return null;
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_METADATA_ARRAY_LENGTH)
      .map((item) => sanitizeMetadataValue(item, depth + 1));
  }

  return Object.entries(value).reduce<Record<string, unknown>>(
    (sanitized, [key, item]) => {
      if (SENSITIVE_METADATA_KEY_PATTERN.test(key)) {
        return sanitized;
      }

      sanitized[key] = sanitizeMetadataValue(item, depth + 1);

      return sanitized;
    },
    {},
  );
}

function mapAuditLog(
  auditLog: Prisma.ClubAuditLogGetPayload<{ select: typeof clubAuditLogSelect }>,
): ClubAuditLogDto {
  return {
    id: auditLog.id,
    action: auditLog.action,
    actorId: auditLog.actorId,
    targetUserId: auditLog.targetUserId,
    entityType: auditLog.entityType,
    entityId: auditLog.entityId,
    metadata: sanitizeMetadataValue(auditLog.metadata ?? null),
    createdAt: auditLog.createdAt.toISOString(),
  };
}

export async function listClubAuditLogs({
  clubId,
  viewerId,
  limit,
  cursor,
  action,
  targetUserId,
  entityType,
  from,
  to,
}: ListClubAuditLogsInput): Promise<ListClubAuditLogsResponseDto> {
  requireAuthenticatedUser(viewerId);

  if (!clubId) {
    validationError('Clube da auditoria nao informado');
  }

  const club = await getClubWithMembers(clubId);
  ensureCanViewClubAuditLogs(club, viewerId);

  const pagination = normalizeCursorPagination(
    {
      limit,
      cursor,
    },
    {
      defaultLimit: AUDIT_DEFAULT_LIMIT,
      maxLimit: AUDIT_MAX_LIMIT,
    },
  );
  const fromDate = normalizeDateFilter(from, 'from');
  const toDate = normalizeDateFilter(to, 'to');
  const createdAt = buildCreatedAtFilter(fromDate, toDate);
  const where: Prisma.ClubAuditLogWhereInput = {
    clubId,
    ...(normalizeStringFilter(action)
      ? { action: normalizeStringFilter(action) }
      : {}),
    ...(normalizeStringFilter(targetUserId)
      ? { targetUserId: normalizeStringFilter(targetUserId) }
      : {}),
    ...(normalizeStringFilter(entityType)
      ? { entityType: normalizeStringFilter(entityType) }
      : {}),
    ...(createdAt ? { createdAt } : {}),
  };

  const auditLogs = await prisma.clubAuditLog.findMany({
    where,
    select: clubAuditLogSelect,
    orderBy: [
      {
        createdAt: 'desc',
      },
      {
        id: 'desc',
      },
    ],
    take: pagination.limit + 1,
    ...getCursorPaginationArgs(pagination),
  });
  const page = buildCursorPaginationResult(auditLogs, pagination.limit);

  return {
    items: page.items.map(mapAuditLog),
    nextCursor: page.nextCursor,
  };
}
