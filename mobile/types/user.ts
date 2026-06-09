export type PublicUserProfileStats = {
  createdTruthsCount: number;
  createdDaresCount: number;
  activePublicClubsCount: number;
  publishedClubPromptsCount: number;
};

export type PublicProfileClub = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string;
  avatarUrl: string | null;
  memberCount: number;
};

export type PublicUserProfile = {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  level: number | null;
  levelLabel: string;
  stats: PublicUserProfileStats;
  publicClubs: PublicProfileClub[];
};
