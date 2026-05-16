import { ClubPromptStatus, ClubStatus } from '../../../generated/prisma/client';
import { ClubPromptDetailDto } from '../../../dtos/clubs.dto';
import { prisma } from '../../../lib/prisma';
import {
  forbiddenError,
  notFoundError,
  requireAuthenticatedUser,
} from '../core/errors';
import { getClubPromptDetail } from './prompts.service';
import {
  canRemovePrompt,
  getActivePromptMembership,
  isPromptManagerRole,
} from './permissions';

type ModerateClubPromptInput = {
  clubId: string;
  promptId: string;
  actorId: string;
  removalReason?: unknown;
};

function normalizeRemovalReason(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const reason = value.trim();

  return reason || null;
}

export async function moderateClubPrompt({
  clubId,
  promptId,
  actorId,
  removalReason,
}: ModerateClubPromptInput): Promise<ClubPromptDetailDto> {
  requireAuthenticatedUser(actorId);

  if (!clubId || !promptId) {
    notFoundError();
  }

  const club = await prisma.club.findUnique({
    where: {
      id: clubId,
    },
    include: {
      members: {
        where: {
          userId: actorId,
        },
      },
    },
  });

  if (!club || club.status === ClubStatus.deleted || club.deletedAt) {
    notFoundError();
  }

  const prompt = await prisma.clubPrompt.findFirst({
    where: {
      id: promptId,
      clubId,
    },
  });

  if (!prompt) {
    notFoundError();
  }

  const membership = getActivePromptMembership(club.members, actorId);

  if (
    !canRemovePrompt({
      club,
      prompt,
      membership,
      viewerId: actorId,
    })
  ) {
    forbiddenError();
  }

  const now = new Date();
  const actorIsAuthor = prompt.authorId === actorId;
  const shouldRemove = !actorIsAuthor && isPromptManagerRole(membership?.role);
  const nextStatus = shouldRemove
    ? ClubPromptStatus.removed
    : ClubPromptStatus.archived;
  const auditAction = shouldRemove
    ? 'club_prompt_removed'
    : 'club_prompt_archived';

  await prisma.$transaction(async (tx) => {
    await tx.clubPrompt.update({
      where: {
        id: prompt.id,
      },
      data: shouldRemove
        ? {
            status: nextStatus,
            removedAt: now,
            removedById: actorId,
            removalReason: normalizeRemovalReason(removalReason),
          }
        : {
            status: nextStatus,
            archivedAt: now,
          },
    });

    await tx.club.update({
      where: {
        id: clubId,
      },
      data: {
        promptCount: {
          decrement: prompt.status === ClubPromptStatus.published ? 1 : 0,
        },
        lastActivityAt: now,
      },
    });

    await tx.clubAuditLog.create({
      data: {
        clubId,
        actorId,
        action: auditAction,
        entityType: 'club_prompt',
        entityId: prompt.id,
        metadata: {
          previousStatus: prompt.status,
          nextStatus,
        },
      },
    });
  });

  return getClubPromptDetail({
    clubId,
    promptId,
    viewerId: actorId,
  });
}
