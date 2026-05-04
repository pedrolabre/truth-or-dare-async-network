export type ProofMediaType = 'image' | 'video';

export type ProofChallengeType = 'truth' | 'dare' | 'club';

export type ProofAuthor = {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string | null;
};

export type ProofRelatedChallenge = {
  id: string;
  type: ProofChallengeType;
  title: string;
  statusLabel?: string;
};

export type ProofDetailItem = {
  id: string;
  challengeId: string;
  challengeType: ProofChallengeType;
  author: ProofAuthor;
  createdAtLabel: string;
  mediaType: ProofMediaType;
  mediaUri?: string | null;
  thumbnailUri?: string | null;
  durationSeconds?: number | null;
  description: string;
  likedByMe: boolean;
  likesCount: number;
  commentsCount: number;
  isOwnProof: boolean;
  relatedChallenge: ProofRelatedChallenge;
};

export type ProofDetailParams = {
  proofId?: string;
};

export type ProofDetailState = {
  proof: ProofDetailItem;
  isVideo: boolean;
  hasMedia: boolean;
  canDelete: boolean;
  primaryActionLabel: string;
};