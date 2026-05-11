import { ClubMemberStatus, ClubStatus } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import {
  forbiddenError,
  notFoundError,
  requireAuthenticatedUser,
} from './clubs.errors';
import { toggleLike } from './likes.service';

type ToggleClubLikeInput = {
  clubId: string;
  userId: string;
};

export async function toggleClubLike({ clubId, userId }: ToggleClubLikeInput) {
  requireAuthenticatedUser(userId);

  if (!clubId) {
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

  if (!club || club.status === ClubStatus.deleted || club.deletedAt) {
    notFoundError();
  }

  const membership = club.members[0];

  if (
    club.status !== ClubStatus.active ||
    membership?.status !== ClubMemberStatus.active
  ) {
    forbiddenError();
  }

  return toggleLike({
    userId,
    targetId: club.id,
    targetType: 'club',
  });
}
