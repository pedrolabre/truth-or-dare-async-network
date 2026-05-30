import {
  SearchClubRecord,
  SearchClubResult,
  SearchUserRecord,
  SearchUserResult,
} from './types';

export function mapUserToSearchResult(
  user: SearchUserRecord,
  mutualCount = 0,
  level: number | null = null,
  isOnline = false,
): SearchUserResult {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    bio: user.bio,
    avatarUrl: null,
    level,
    isOnline,
    mutualCount,
  };
}

export function mapClubToSearchResult(
  club: SearchClubRecord,
  isTrending = false,
): SearchClubResult {
  return {
    id: club.id,
    name: club.name,
    slug: club.slug,
    description: club.description,
    iconName: club.iconName,
    avatarUrl: club.avatarUrl,
    memberCount: club.memberCount,
    isTrending,
    tags: club.tags,
  };
}
