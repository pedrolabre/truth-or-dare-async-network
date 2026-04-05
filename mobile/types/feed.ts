export type FilterKey = 'popular' | 'friends' | 'party' | 'spicy';

export type BottomNavKey = 'play' | 'search' | 'clubs' | 'profile';

export type FeedBadge = 'Verdade' | 'Desafio';

export type FeedTruthItem = {
  id: string;
  type: 'truth';
  title: string;
  time: string;
  likes: number; // manter por compatibilidade
  likesCount: number;
  likedByMe: boolean;
  comments: number;
  participants: string[];
  extraCount: number;
  canDelete: boolean;
};

export type FeedDareItem = {
  id: string;
  type: 'dare';
  challenger: string;
  title: string;
  attemptsLabel: string;
  expiresIn: string;
  progress: number;
  canDelete: boolean;
  status: 'active' | 'concluded' | 'expired' | 'failed';
  attemptsUsed: number;
  maxAttempts: number | null;
  completedAt: string | null;
  expiresAt: string | null;
  interactionDisabled: boolean;
  likesCount: number;
  likedByMe: boolean;
};

export type FeedClubItem = {
  id: string;
  type: 'club';
  clubName: string;
  badge: FeedBadge;
  quote: string;
  answersCount: number;
  likesCount: number;
  likedByMe: boolean;
};

export type FeedItem = FeedTruthItem | FeedDareItem | FeedClubItem;

export type FeedFilterOption = {
  key: FilterKey;
  label: string;
};

export type BottomNavItem = {
  key: BottomNavKey;
  label: string;
  icon: 'style' | 'search' | 'groups' | 'person';
};

export type FeedColors = {
  surfaceBright: string;
  onSurface: string;
  onSurfaceVariant: string;
  surfaceContainerHigh: string;
  surfaceContainer: string;
  surfaceContainerLow: string;
  surfaceDim: string;
  outline: string;
  outlineVariant: string;
  primary: string;
  secondary: string;
  tertiary: string;
  onPrimary: string;
  onSecondary: string;
  onTertiary: string;
  primaryContainer: string;
  secondaryContainer: string;
  tertiaryFixed: string;
  headerGreen: string;
  greenAccent: string;
  greenSoft: string;
  greenText: string;
  greenBgSoft: string;
  redBgSoft: string;
  white: string;
};