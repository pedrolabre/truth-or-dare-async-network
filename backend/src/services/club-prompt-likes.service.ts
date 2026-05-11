import {
  ClubPromptStatus,
  ClubStatus,
  LikeTargetType,
  Prisma,
} from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import {
  forbiddenError,
  notFoundError,
  requireAuthenticatedUser,
} from './clubs.errors';
import {
  canAnswerPrompt,
  getActivePromptMembership,
} from './club-prompts.permissions';

type ToggleClubPromptLikeInput = {
  clubId: string;
  promptId: string;
  userId: string;
};

type ToggleClubPromptResponseLikeInput = ToggleClubPromptLikeInput & {
  responseId: string;
};

type ToggleClubPromptLikeResult = {
  liked: boolean;
  likesCount: number;
};

function isDeletedClub(club: { status: ClubStatus; deletedAt: Date | null }) {
  return club.status === ClubStatus.deleted || Boolean(club.deletedAt);
}

function isUnavailablePrompt(prompt: {
  status: ClubPromptStatus;
  archivedAt: Date | null;
  removedAt: Date | null;
  expiresAt: Date | null;
}) {
  return (
    prompt.status !== ClubPromptStatus.published ||
    Boolean(prompt.archivedAt) ||
    Boolean(prompt.removedAt) ||
    Boolean(prompt.expiresAt && prompt.expiresAt.getTime() <= Date.now())
  );
}

async function toggleLikeAndSyncCount({
  userId,
  targetId,
  targetType,
  syncCount,
}: {
  userId: string;
  targetId: string;
  targetType: LikeTargetType;
  syncCount: (
    tx: Prisma.TransactionClient,
    likesCount: number,
  ) => Promise<unknown>;
}): Promise<ToggleClubPromptLikeResult> {
  return prisma.$transaction(async (tx) => {
    const existingLike = await tx.like.findUnique({
      where: {
        userId_targetId_targetType: {
          userId,
          targetId,
          targetType,
        },
      },
    });

    if (existingLike) {
      await tx.like.delete({
        where: {
          id: existingLike.id,
        },
      });
    } else {
      await tx.like.create({
        data: {
          userId,
          targetId,
          targetType,
        },
      });
    }

    const likesCount = await tx.like.count({
      where: {
        targetId,
        targetType,
      },
    });

    await syncCount(tx, likesCount);

    return {
      liked: !existingLike,
      likesCount,
    };
  });
}

async function getClubPromptLikeContext({
  clubId,
  promptId,
  userId,
}: ToggleClubPromptLikeInput) {
  requireAuthenticatedUser(userId);

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
          userId,
        },
      },
    },
  });

  if (!club || isDeletedClub(club)) {
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

  if (
    !canAnswerPrompt({ club, prompt, membership }) ||
    isUnavailablePrompt(prompt)
  ) {
    forbiddenError();
  }

  return {
    club,
    prompt,
  };
}

export async function toggleClubPromptLike(
  input: ToggleClubPromptLikeInput,
): Promise<ToggleClubPromptLikeResult> {
  const { prompt } = await getClubPromptLikeContext(input);

  return toggleLikeAndSyncCount({
    userId: input.userId,
    targetId: prompt.id,
    targetType: LikeTargetType.club_prompt,
    syncCount: (tx, likesCount) =>
      tx.clubPrompt.update({
        where: {
          id: prompt.id,
        },
        data: {
          likesCount,
        },
      }),
  });
}

export async function toggleClubPromptResponseLike({
  clubId,
  promptId,
  responseId,
  userId,
}: ToggleClubPromptResponseLikeInput): Promise<ToggleClubPromptLikeResult> {
  await getClubPromptLikeContext({
    clubId,
    promptId,
    userId,
  });

  if (!responseId) {
    notFoundError();
  }

  const response = await prisma.clubPromptResponse.findFirst({
    where: {
      id: responseId,
      clubId,
      promptId,
    },
  });

  if (!response) {
    notFoundError();
  }

  if (response.archivedAt || response.removedAt) {
    forbiddenError();
  }

  return toggleLikeAndSyncCount({
    userId,
    targetId: response.id,
    targetType: LikeTargetType.club_response,
    syncCount: (tx, likesCount) =>
      tx.clubPromptResponse.update({
        where: {
          id: response.id,
        },
        data: {
          likesCount,
        },
      }),
  });
}
