import { prisma } from '../../lib/prisma';
import { rateLimitError } from './core/errors';

export type ClubRateLimitAction =
  | 'create_club'
  | 'create_club_invite'
  | 'create_club_prompt';

type ClubRateLimitRule = {
  max: number;
  windowMs: number;
  message: string;
};

const HOUR_MS = 60 * 60 * 1000;

export const CLUB_RATE_LIMITS: Record<ClubRateLimitAction, ClubRateLimitRule> = {
  create_club: {
    max: 5,
    windowMs: HOUR_MS,
    message: 'Limite de criacao de clubes atingido. Tente novamente mais tarde',
  },
  create_club_invite: {
    max: 20,
    windowMs: HOUR_MS,
    message: 'Limite de convites do clube atingido. Tente novamente mais tarde',
  },
  create_club_prompt: {
    max: 30,
    windowMs: HOUR_MS,
    message: 'Limite de prompts do clube atingido. Tente novamente mais tarde',
  },
};

type EnforceClubRateLimitInput = {
  action: ClubRateLimitAction;
  actorId: string;
  clubId?: string;
};

async function countRateLimitedActions({
  action,
  actorId,
  clubId,
  since,
}: EnforceClubRateLimitInput & { since: Date }) {
  switch (action) {
    case 'create_club':
      return prisma.club.count({
        where: {
          createdById: actorId,
          createdAt: {
            gte: since,
          },
        },
      });
    case 'create_club_invite':
      return prisma.clubInvite.count({
        where: {
          inviterId: actorId,
          ...(clubId ? { clubId } : {}),
          createdAt: {
            gte: since,
          },
        },
      });
    case 'create_club_prompt':
      return prisma.clubPrompt.count({
        where: {
          authorId: actorId,
          ...(clubId ? { clubId } : {}),
          createdAt: {
            gte: since,
          },
        },
      });
    default:
      return 0;
  }
}

export async function enforceClubRateLimit(input: EnforceClubRateLimitInput) {
  const rule = CLUB_RATE_LIMITS[input.action];
  const since = new Date(Date.now() - rule.windowMs);
  const count = await countRateLimitedActions({
    ...input,
    since,
  });

  if (count >= rule.max) {
    rateLimitError(rule.message);
  }
}
