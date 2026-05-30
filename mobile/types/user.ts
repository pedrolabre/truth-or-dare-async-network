export type PublicUserProfileStats = {
  createdTruthsCount: number;
  createdDaresCount: number;
  activePublicClubsCount: number;
  publishedClubPromptsCount: number;
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
};
