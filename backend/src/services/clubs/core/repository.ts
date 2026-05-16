import { ClubStatus } from '../../../generated/prisma/client';
import { prisma } from '../../../lib/prisma';
import { notFoundError } from './errors';

export async function getClubWithMembers(clubId: string) {
  const club = await prisma.club.findUnique({
    where: {
      id: clubId,
    },
    include: {
      members: true,
    },
  });

  if (!club || club.status === ClubStatus.deleted || club.deletedAt) {
    notFoundError();
  }

  return club;
}
