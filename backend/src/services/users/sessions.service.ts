import { randomUUID } from 'crypto';
import { prisma } from '../../lib/prisma';
import {
  sessionNotFoundError,
  userNotFoundError,
  validationError,
} from './settings.errors';

type RegisterUserSessionInput = {
  userId: string;
  deviceName?: unknown;
  platform?: unknown;
  ipAddress?: string | null;
};

type ListUserSessionsInput = {
  userId: string;
  currentSessionId?: string;
};

type RevokeUserSessionInput = {
  userId: string;
  sessionId: string;
};

type RevokeOtherUserSessionsInput = {
  userId: string;
  currentSessionId?: string;
};

const UNKNOWN_DEVICE_NAME = 'Dispositivo desconhecido';
const MAX_DEVICE_FIELD_LENGTH = 120;

type UserSessionRecord = {
  id: string;
  userId: string;
  deviceName: string | null;
  platform: string | null;
  ipAddress: string | null;
  lastActiveAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
};

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, MAX_DEVICE_FIELD_LENGTH);
}

function requireSessionId(sessionId: string): string {
  const trimmedSessionId = sessionId.trim();

  if (!trimmedSessionId) {
    validationError('Sessao invalida');
  }

  return trimmedSessionId;
}

async function ensureActiveUser(userId: string) {
  if (!userId) {
    userNotFoundError();
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) {
    userNotFoundError();
  }
}

function mapSession(session: UserSessionRecord, currentSessionId?: string) {
  return {
    id: session.id,
    userId: session.userId,
    deviceName: session.deviceName ?? UNKNOWN_DEVICE_NAME,
    platform: session.platform,
    ipAddress: session.ipAddress,
    lastActiveAt: session.lastActiveAt,
    createdAt: session.createdAt,
    revokedAt: session.revokedAt,
    isCurrent: Boolean(currentSessionId && session.id === currentSessionId),
  };
}

export async function registerUserSession({
  userId,
  deviceName,
  platform,
  ipAddress,
}: RegisterUserSessionInput) {
  const sessionId = randomUUID();
  const sessionDeviceName =
    normalizeOptionalText(deviceName) ?? UNKNOWN_DEVICE_NAME;
  const sessionPlatform = normalizeOptionalText(platform);
  const sessionIpAddress = normalizeOptionalText(ipAddress);
  const [session] = await prisma.$queryRaw<UserSessionRecord[]>`
    INSERT INTO "UserSession" (
      "id",
      "userId",
      "deviceName",
      "platform",
      "ipAddress",
      "lastActiveAt"
    )
    VALUES (
      ${sessionId},
      ${userId},
      ${sessionDeviceName},
      ${sessionPlatform},
      ${sessionIpAddress},
      ${new Date()}
    )
    RETURNING
      "id",
      "userId",
      "deviceName",
      "platform",
      "ipAddress",
      "lastActiveAt",
      "createdAt",
      "revokedAt"
  `;

  return session;
}

export async function listUserSessions({
  userId,
  currentSessionId,
}: ListUserSessionsInput) {
  await ensureActiveUser(userId);

  const sessions = await prisma.$queryRaw<UserSessionRecord[]>`
    SELECT
      "id",
      "userId",
      "deviceName",
      "platform",
      "ipAddress",
      "lastActiveAt",
      "createdAt",
      "revokedAt"
    FROM "UserSession"
    WHERE "userId" = ${userId}
      AND "revokedAt" IS NULL
    ORDER BY "lastActiveAt" DESC
  `;

  return {
    sessions: sessions.map((session) => mapSession(session, currentSessionId)),
  };
}

export async function revokeUserSession({
  userId,
  sessionId,
}: RevokeUserSessionInput) {
  await ensureActiveUser(userId);

  const targetSessionId = requireSessionId(sessionId);
  const count = await prisma.$executeRaw`
    UPDATE "UserSession"
    SET "revokedAt" = ${new Date()}
    WHERE "id" = ${targetSessionId}
      AND "userId" = ${userId}
      AND "revokedAt" IS NULL
  `;

  if (count === 0) {
    sessionNotFoundError();
  }

  return {
    ok: true,
  };
}

export async function revokeOtherUserSessions({
  userId,
  currentSessionId,
}: RevokeOtherUserSessionsInput) {
  await ensureActiveUser(userId);

  const revokedAt = new Date();
  const count = currentSessionId
    ? await prisma.$executeRaw`
        UPDATE "UserSession"
        SET "revokedAt" = ${revokedAt}
        WHERE "userId" = ${userId}
          AND "revokedAt" IS NULL
          AND "id" <> ${currentSessionId}
      `
    : await prisma.$executeRaw`
        UPDATE "UserSession"
        SET "revokedAt" = ${revokedAt}
        WHERE "userId" = ${userId}
          AND "revokedAt" IS NULL
      `;

  return {
    ok: true,
    revokedCount: count,
  };
}
