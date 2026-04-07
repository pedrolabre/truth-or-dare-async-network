export type ProfileStats = {
  truths: number;
  dares: number;
  completed: number;
};

export type ProfileUser = {
  id: string;
  name: string;
  username: string;
  bio?: string;
  initials: string;
  stats: ProfileStats;
};