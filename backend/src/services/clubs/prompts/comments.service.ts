import { ClubPromptCommentSummaryDto } from '../../../dtos/clubs.dto';
import { ClubStatus } from '../../../generated/prisma/client';
import { prisma } from '../../../lib/prisma';
import {
  forbiddenError,
  notFoundError,
  requireAuthenticatedUser,
} from '../core/errors';
import {
  assertContentAllowedByClub,
  assertMemberCanPost,
} from '../moderation.service';
import { normalizePromptCommentText } from './interactions.validators';
import {
  canAnswerPrompt,
  getActivePromptMembership,
} from './permissions';
import {
  emitClubMentionEvent,
  emitClubPromptCommentEvent,
} from '../club-events.service';
import {
  isEligibleClubRecipient,
  resolveMentionedClubRecipientIds,
} from '../notification-recipients';

type CreateClubPromptCommentInput = {
  clubId: string;
  promptId: string;
  userId: string;
  text: unknown;
};

type ClubPromptCommentSummarySource = {
  id: string;
  clubId: string;
  promptId: string;
  responseId: string | null;
  userId: string;
  user: {
    name: string;
  };
  parentId: string | null;
  text: string;
  likesCount: number;
  repliesCount: number;
  createdAt: Date;
  updatedAt: Date;
};

function mapPromptCommentSummary(
  comment: ClubPromptCommentSummarySource,
): ClubPromptCommentSummaryDto {
  return {
    id: comment.id,
    clubId: comment.clubId,
    promptId: comment.promptId,
    responseId: comment.responseId,
    userId: comment.userId,
    userName: comment.user.name,
    parentId: comment.parentId,
    text: comment.text,
    likesCount: comment.likesCount,
    repliesCount: comment.repliesCount,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

export async function createClubPromptComment({
  clubId,
  promptId,
  userId,
  text,
}: CreateClubPromptCommentInput): Promise<ClubPromptCommentSummaryDto> {
  requireAuthenticatedUser(userId);

  if (!clubId || !promptId) {
    notFoundError();
  }

  const normalizedText = normalizePromptCommentText(text);
  const club = await prisma.club.findUnique({
    where: {
      id: clubId,
    },
    include: {
      members: {
        where: {
          userId,
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

  const membership = getActivePromptMembership(club.members, userId);

  if (!canAnswerPrompt({ club, prompt, membership })) {
    forbiddenError();
  }

  assertMemberCanPost(membership);
  assertContentAllowedByClub(normalizedText, club.blockedWords);

  if (prompt.expiresAt && prompt.expiresAt.getTime() <= Date.now()) {
    forbiddenError();
  }

  const now = new Date();
  const commentId = await prisma.$transaction(async (tx) => {
    const createdComment = await tx.clubPromptComment.create({
      data: {
        clubId,
        promptId: prompt.id,
        userId,
        text: normalizedText,
      },
    });

    await tx.clubPrompt.update({
      where: {
        id: prompt.id,
      },
      data: {
        commentsCount: {
          increment: 1,
        },
      },
    });

    await tx.club.update({
      where: {
        id: clubId,
      },
      data: {
        lastActivityAt: now,
      },
    });

    await tx.clubAuditLog.create({
      data: {
        clubId,
        actorId: userId,
        action: 'club_prompt_comment_created',
        entityType: 'club_prompt_comment',
        entityId: createdComment.id,
        metadata: {
          promptId: prompt.id,
        },
      },
    });

    return createdComment.id;
  });

  const comment = await prisma.clubPromptComment.findUniqueOrThrow({
    where: {
      id: commentId,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  const commentRecipientIds: string[] = [];
  const shouldNotifyPromptAuthor =
    prompt.authorId !== userId &&
    (await isEligibleClubRecipient({
      clubId,
      userId: prompt.authorId,
      respectMute: true,
    }));

  if (shouldNotifyPromptAuthor) {
    commentRecipientIds.push(prompt.authorId);
  }

  if (commentRecipientIds.length > 0) {
    await emitClubPromptCommentEvent({
      clubId,
      clubName: club.name,
      actorId: userId,
      recipientIds: commentRecipientIds,
      promptId: prompt.id,
      commentId,
      commenterId: userId,
      responseId: null,
    });
  }

  const mentionedUserIds = await resolveMentionedClubRecipientIds({
    clubId,
    text: normalizedText,
    excludeUserIds: [userId, ...commentRecipientIds],
    respectMute: true,
  });

  if (mentionedUserIds.length > 0) {
    await emitClubMentionEvent({
      clubId,
      clubName: club.name,
      actorId: userId,
      mentionedUserIds,
      mentionId: commentId,
      referenceType: 'club_prompt_comment',
      referenceId: commentId,
      mentionedById: userId,
      promptId: prompt.id,
    });
  }

  return mapPromptCommentSummary(comment);
}
