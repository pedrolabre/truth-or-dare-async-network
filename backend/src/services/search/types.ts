import { Prisma } from '../../generated/prisma/client';

export type SearchPaginationOptions = {
  limit?: number;
  cursor?: string | null;
  offset?: number | null;
};

export type SearchUsersOptions = SearchPaginationOptions & {
  userId: string;
  minLevel?: number | null;
  maxLevel?: number | null;
  onlineOnly?: boolean;
  now?: Date;
};

export type SearchClubsOptions = SearchPaginationOptions & {
  userId: string;
  clubVisibility?: 'public' | null;
  clubTag?: string | null;
  now?: Date;
  trendingMemberGrowthThreshold?: number;
  trendingWindowHours?: number;
};

export type SearchContentOptions = SearchPaginationOptions & {
  userId: string;
  now?: Date;
};

export type SearchDiscoveryOptions = {
  userId: string;
  limit?: number;
  now?: Date;
  trendingMemberGrowthThreshold?: number;
  trendingWindowHours?: number;
};

export type NormalizedSearchPaginationOptions = {
  limit: number;
  cursor?: string;
  offset?: number;
};

export type SearchPaginationResult<T> = {
  items: T[];
  nextCursor: string | null;
};

export type SearchUserResult = {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  level: number | null;
  isOnline: boolean;
  mutualCount: number;
};

export type SearchClubResult = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string;
  avatarUrl: string | null;
  memberCount: number;
  isTrending: boolean;
  tags: string[];
};

export type SearchContentSourceType =
  | 'truth'
  | 'dare'
  | 'truth_comment'
  | 'club_prompt'
  | 'club_prompt_comment';

export type SearchContentRoute =
  | 'feed-comments'
  | 'action-screen'
  | 'club-detail';

export type SearchContentResult = {
  id: string;
  sourceId: string;
  sourceType: SearchContentSourceType;
  contentType: 'truth' | 'dare' | 'comment';
  parentId: string | null;
  clubId: string | null;
  clubName: string | null;
  title: string;
  snippet: string;
  badgeLabel: string;
  authorName: string | null;
  commentsCount: number;
  likesCount: number;
  createdAt: Date;
  route: SearchContentRoute;
};

export type SearchUserRecord = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    username: true;
    bio: true;
  };
}>;

export type SearchClubRecord = Prisma.ClubGetPayload<{
  select: {
    id: true;
    name: true;
    slug: true;
    description: true;
    iconName: true;
    avatarUrl: true;
    memberCount: true;
    tags: true;
  };
}>;
