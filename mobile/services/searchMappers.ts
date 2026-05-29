import type {
  SearchApiClubItem,
  SearchApiUserItem,
  SearchClubIconName,
  SearchClubItem,
  SearchUserItem,
} from '../types/search';

const DEFAULT_USER_NAME = 'Usuario';
const DEFAULT_CLUB_NAME = 'Clube';
const DEFAULT_CLUB_DESCRIPTION = 'Clube sem descricao por enquanto.';
const DEFAULT_CLUB_ICON_NAME: SearchClubIconName = 'groups';

const SEARCH_CLUB_ICON_NAMES = new Set<SearchClubIconName>([
  'groups',
  'sports-esports',
  'local-fire-department',
  'auto-awesome',
  'celebration',
  'school',
  'nightlife',
  'favorite',
]);

function trimToUndefined(value: string | null | undefined): string | undefined {
  const trimmedValue = value?.trim();

  return trimmedValue || undefined;
}

function normalizeName(
  value: string | null | undefined,
  fallback: string,
): string {
  return trimToUndefined(value) ?? fallback;
}

function normalizeUsername(
  username: string | null | undefined,
  userId: string,
): string {
  return trimToUndefined(username)?.replace(/^@/, '') || `usuario-${userId}`;
}

function normalizeCount(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function normalizeLevel(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.floor(value));
}

function formatLevelLabel(level: number | null): string {
  return typeof level === 'number' ? `Nivel ${level}` : 'Nivel inicial';
}

function formatMemberCountLabel(memberCount: number): string {
  const memberLabel = memberCount === 1 ? 'membro' : 'membros';

  return `${memberCount} ${memberLabel}`;
}

function normalizeClubIconName(
  iconName: SearchApiClubItem['iconName'] | undefined,
): SearchClubIconName {
  const trimmedIconName = trimToUndefined(iconName);

  if (
    trimmedIconName &&
    SEARCH_CLUB_ICON_NAMES.has(trimmedIconName as SearchClubIconName)
  ) {
    return trimmedIconName as SearchClubIconName;
  }

  return DEFAULT_CLUB_ICON_NAME;
}

export function mapApiUserToItem(apiUser: SearchApiUserItem): SearchUserItem {
  const level = normalizeLevel(apiUser.level);

  return {
    id: apiUser.id,
    name: normalizeName(apiUser.name, DEFAULT_USER_NAME),
    username: normalizeUsername(apiUser.username, apiUser.id),
    bio: trimToUndefined(apiUser.bio),
    level,
    levelLabel: formatLevelLabel(level),
    avatarUrl: trimToUndefined(apiUser.avatarUrl),
    mutualCount: normalizeCount(apiUser.mutualCount),
  };
}

export function mapApiClubToItem(apiClub: SearchApiClubItem): SearchClubItem {
  const memberCount = normalizeCount(apiClub.memberCount);
  const isTrending = Boolean(apiClub.isTrending);

  return {
    id: apiClub.id,
    slug: apiClub.slug,
    name: normalizeName(apiClub.name, DEFAULT_CLUB_NAME),
    memberCount,
    memberCountLabel: formatMemberCountLabel(memberCount),
    description:
      trimToUndefined(apiClub.description) ?? DEFAULT_CLUB_DESCRIPTION,
    iconName: normalizeClubIconName(apiClub.iconName),
    imageUrl: trimToUndefined(apiClub.avatarUrl),
    badgeLabel: isTrending ? 'Em alta' : undefined,
    isTrending,
    tags: Array.isArray(apiClub.tags) ? apiClub.tags : [],
  };
}
