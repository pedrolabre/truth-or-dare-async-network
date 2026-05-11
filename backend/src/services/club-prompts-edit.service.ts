import { ClubMemberRole, ClubStatus, Prisma } from '../generated/prisma/client';
import { ClubPromptDetailDto } from '../dtos/clubs.dto';
import { prisma } from '../lib/prisma';
import {
  forbiddenError,
  notFoundError,
  requireAuthenticatedUser,
  validationError,
} from './clubs.errors';
import { getClubPromptDetail } from './club-prompts.service';
import {
  canEditPrompt,
  getActivePromptMembership,
  isPromptManagerRole,
} from './club-prompts.permissions';
import {
  normalizeAttachments,
  normalizeBoolean,
  normalizeContent,
  normalizeDifficulty,
  normalizeMaxAttempts,
  normalizeOptionalDate,
  normalizePromptType,
} from './club-prompts.validators';

type UpdateClubPromptInput = {
  clubId: string;
  promptId: string;
  actorId: string;
  type?: unknown;
  content?: unknown;
  maxAttempts?: unknown;
  expiresAt?: unknown;
  difficulty?: unknown;
  attachments?: unknown;
  isPinned?: unknown;
  isMembersOnly?: unknown;
};

function hasOwn(input: UpdateClubPromptInput, key: keyof UpdateClubPromptInput) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function ensureCanSetPinned(value: boolean | undefined, role: ClubMemberRole) {
  if (value && !isPromptManagerRole(role)) {
    forbiddenError();
  }
}

export async function updateClubPrompt(
  input: UpdateClubPromptInput,
): Promise<ClubPromptDetailDto> {
  requireAuthenticatedUser(input.actorId);

  if (!input.clubId || !input.promptId) {
    notFoundError();
  }

  const club = await prisma.club.findUnique({
    where: {
      id: input.clubId,
    },
    include: {
      members: {
        where: {
          userId: input.actorId,
        },
      },
    },
  });

  if (!club || club.status === ClubStatus.deleted || club.deletedAt) {
    notFoundError();
  }

  if (club.status !== ClubStatus.active) {
    forbiddenError();
  }

  const prompt = await prisma.clubPrompt.findFirst({
    where: {
      id: input.promptId,
      clubId: input.clubId,
    },
    include: {
      _count: {
        select: {
          responses: {
            where: {
              removedAt: null,
            },
          },
        },
      },
    },
  });

  if (!prompt) {
    notFoundError();
  }

  const membership = getActivePromptMembership(club.members, input.actorId);

  if (!membership) {
    forbiddenError();
  }

  const hasResponses = prompt._count.responses > 0;

  if (
    !canEditPrompt({
      club,
      prompt,
      membership,
      viewerId: input.actorId,
      hasResponses,
    })
  ) {
    forbiddenError();
  }

  const data: Prisma.ClubPromptUpdateInput = {};
  const type = hasOwn(input, 'type')
    ? normalizePromptType(input.type)
    : prompt.type;

  if (hasOwn(input, 'type')) {
    data.type = type;
  }

  if (hasOwn(input, 'content')) {
    data.content = normalizeContent(input.content);
  }

  if (hasOwn(input, 'type') || hasOwn(input, 'maxAttempts')) {
    data.maxAttempts = hasOwn(input, 'maxAttempts')
      ? normalizeMaxAttempts(input.maxAttempts, type)
      : normalizeMaxAttempts(prompt.maxAttempts, type);
  }

  if (hasOwn(input, 'expiresAt')) {
    data.expiresAt = normalizeOptionalDate(input.expiresAt);
  }

  if (hasOwn(input, 'difficulty')) {
    data.difficulty = normalizeDifficulty(input.difficulty);
  }

  if (hasOwn(input, 'attachments')) {
    const attachments = normalizeAttachments(input.attachments);

    data.attachments = attachments ?? Prisma.JsonNull;
  }

  if (hasOwn(input, 'isPinned')) {
    const isPinned = normalizeBoolean(input.isPinned, prompt.isPinned);

    ensureCanSetPinned(isPinned, membership.role);
    data.isPinned = isPinned;
  }

  if (hasOwn(input, 'isMembersOnly')) {
    data.isMembersOnly = normalizeBoolean(
      input.isMembersOnly,
      prompt.isMembersOnly,
    );
  }

  if (Object.keys(data).length === 0) {
    validationError('Informe ao menos um campo para editar');
  }

  await prisma.$transaction(async (tx) => {
    await tx.clubPrompt.update({
      where: {
        id: prompt.id,
      },
      data,
    });

    await tx.club.update({
      where: {
        id: input.clubId,
      },
      data: {
        lastActivityAt: new Date(),
      },
    });

    await tx.clubAuditLog.create({
      data: {
        clubId: input.clubId,
        actorId: input.actorId,
        action: 'club_prompt_updated',
        entityType: 'club_prompt',
        entityId: prompt.id,
        metadata: {
          fields: Object.keys(data),
        },
      },
    });
  });

  return getClubPromptDetail({
    clubId: input.clubId,
    promptId: input.promptId,
    viewerId: input.actorId,
  });
}
