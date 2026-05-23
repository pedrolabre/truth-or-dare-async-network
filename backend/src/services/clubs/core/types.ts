import { Prisma } from '../../../generated/prisma/client';
import { ClubSummaryDto } from '../../../dtos/clubs.dto';

export type CreateClubInput = {
  creatorId: string;
  name: unknown;
  description?: unknown;
  iconName?: unknown;
  visibility?: unknown;
  rules?: unknown;
  initialMemberIds?: unknown;
  tags?: unknown;
};

export type UpdateClubInput = {
  clubId: string;
  userId: string;
  name?: unknown;
  description?: unknown;
  iconName?: unknown;
  visibility?: unknown;
  rules?: unknown;
  blockedWords?: unknown;
  tags?: unknown;
};

export type ClubWithViewerMembers = Prisma.ClubGetPayload<{
  include: {
    members: true;
  };
}>;

export type ClubMemberWithClub = Prisma.ClubMemberGetPayload<{
  include: {
    club: {
      include: {
        members: true;
      };
    };
  };
}>;

export type DiscoverClubsResult = {
  suggested: ClubSummaryDto[];
  popular: ClubSummaryDto[];
  recent: ClubSummaryDto[];
};
