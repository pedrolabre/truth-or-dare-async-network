export type ProofMediaType = 'image' | 'video' | 'audio' | 'file';
export type DareProofMediaTypeApi = 'image' | 'video' | 'audio' | 'file';

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
  dareId?: string;
  title?: string;
  challenger?: string;
  mediaType?: string;
  localUri?: string;
  fileName?: string;
  durationSeconds?: string;
  text?: string;
  source?: string;
};

export type DareProofDetailsResponse = {
  id: string;
  dareId: string;
  userId: string;
  mediaType: DareProofMediaTypeApi;
  fileUrl: string;
  durationSeconds: number | null;
  text: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string | null;
    avatarUrl: string | null;
  };
  dare: {
    id: string;
    content: string;
    authorId: string;
    targetUserId: string;
    completedAt: string | null;
  };
};

export type ProofDetailState = {
  proof: ProofDetailItem;
  isVideo: boolean;
  isAudio: boolean;
  isImage: boolean;
  hasMedia: boolean;
  canDelete: boolean;
  primaryActionLabel: string;
  contentState: 'local-draft' | 'loading' | 'ready' | 'error' | 'access-denied' | 'not-found';
  errorMessage: string | null;
  isFromCache: boolean;
  syncErrorMessage: string | null;
};
