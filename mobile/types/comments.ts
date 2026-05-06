export type FeedCommentsItemType = 'truth' | 'dare' | 'club';

export type FeedCommentsRouteParams = {
  itemId?: string;
  itemType?: string;
  title?: string;
  clubName?: string;
  badge?: string;
  quote?: string;
  commentsCount?: string;
  likesCount?: string;
  status?: string;
};

export type FeedCommentsColors = {
  surfaceBright: string;
  onSurface: string;
  onSurfaceVariant: string;
  surfaceContainer: string;
  surfaceContainerLow: string;
  surfaceDim: string;
  outline: string;
  outlineVariant: string;
  primary: string;
  tertiary: string;
  headerGreen: string;
  greenText: string;
  greenBgSoft: string;
  redBgSoft: string;
  white: string;
};

export type FeedCommentReply = {
  id: string;
  author: string;
  time: string;
  content: string;
  likesCount: number;
  likedByMe: boolean;
};

export type FeedComment = {
  id: string;
  author: string;
  time: string;
  content: string;
  likesCount: number;
  likedByMe: boolean;
  replies: FeedCommentReply[];
};

export type FeedCommentsContext = {
  eyebrow: string;
  badge: string;
  text: string;
  meta: string;
  likesCountLabel: string;
  accentColor: string;
  accentSoft: string;
  icon: 'groups' | 'bolt' | 'forum';
};

export type FeedCommentsModalType = 'share' | 'mute' | 'report' | null;

export type FeedCommentsReportReason =
  | 'Spam ou fraude'
  | 'Discurso de ódio ou ofensa'
  | 'Conteúdo sexual ou nudez'
  | 'Assédio ou bullying';

export type FeedCommentsReportStep = 1 | 2 | 3;

export type FeedCommentsReplyTarget = {
  commentId: string;
  author: string;
} | null;

export type UseFeedCommentsScreenInput = {
  params: FeedCommentsRouteParams;
  colors: FeedCommentsColors;
};

export type TruthCommentApiAuthor = {
  id: string;
  name: string;
  email: string;
};

export type TruthCommentApiReply = {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  likedByMe: boolean;
  author: TruthCommentApiAuthor;
};

export type TruthCommentApiItem = {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  likedByMe: boolean;
  author: TruthCommentApiAuthor;
  replies: TruthCommentApiReply[];
};

export type CreateTruthCommentPayload = {
  text: string;
  parentId?: string;
};

export type ToggleTruthCommentLikeResponse = {
  liked: boolean;
  likesCount: number;
};