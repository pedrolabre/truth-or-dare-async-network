import {
  ClubPromptAttachmentDto,
  ClubPromptDetailDto,
  ClubPromptResponseSummaryDto,
  ClubPromptSummaryDto,
} from '../dtos/clubs.dto';

type ClubPromptSummarySource = {
  id: string;
  clubId: string;
  authorId: string;
  author: {
    name: string;
  };
  type: ClubPromptSummaryDto['type'];
  status: ClubPromptSummaryDto['status'];
  content: string;
  difficulty: string | null;
  attachments: unknown;
  maxAttempts: number | null;
  expiresAt: Date | null;
  publishedAt: Date | null;
  answersCount: number;
  commentsCount: number;
  likesCount: number;
  isPinned: boolean;
  isMembersOnly: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ClubPromptResponseSummarySource = {
  id: string;
  clubId: string;
  promptId: string;
  userId: string;
  user: {
    name: string;
  };
  text: string | null;
  mediaUrl: string | null;
  mediaType: ClubPromptResponseSummaryDto['mediaType'];
  dareProofId: string | null;
  attemptsUsed: number;
  completedAt: Date | null;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
};

type ClubPromptDetailSource = ClubPromptSummarySource & {
  archivedAt: Date | null;
  removedAt: Date | null;
  removedById: string | null;
  removalReason: string | null;
  responses: ClubPromptResponseSummarySource[];
};

type ClubPromptViewerState = ClubPromptDetailDto['viewerState'];

export function mapPromptSummary(
  prompt: ClubPromptSummarySource,
): ClubPromptSummaryDto {
  const attachments = Array.isArray(prompt.attachments)
    ? (prompt.attachments as ClubPromptAttachmentDto[])
    : [];

  return {
    id: prompt.id,
    clubId: prompt.clubId,
    authorId: prompt.authorId,
    authorName: prompt.author.name,
    type: prompt.type,
    status: prompt.status,
    content: prompt.content,
    difficulty: prompt.difficulty,
    attachments,
    maxAttempts: prompt.maxAttempts,
    expiresAt: prompt.expiresAt?.toISOString() ?? null,
    publishedAt: prompt.publishedAt?.toISOString() ?? null,
    answersCount: prompt.answersCount,
    commentsCount: prompt.commentsCount,
    likesCount: prompt.likesCount,
    isPinned: prompt.isPinned,
    isMembersOnly: prompt.isMembersOnly,
    createdAt: prompt.createdAt.toISOString(),
    updatedAt: prompt.updatedAt.toISOString(),
  };
}

function mapPromptResponseSummary(
  response: ClubPromptResponseSummarySource,
): ClubPromptResponseSummaryDto {
  return {
    id: response.id,
    clubId: response.clubId,
    promptId: response.promptId,
    userId: response.userId,
    userName: response.user.name,
    text: response.text,
    mediaUrl: response.mediaUrl,
    mediaType: response.mediaType,
    dareProofId: response.dareProofId,
    attemptsUsed: response.attemptsUsed,
    completedAt: response.completedAt?.toISOString() ?? null,
    likesCount: response.likesCount,
    commentsCount: response.commentsCount,
    createdAt: response.createdAt.toISOString(),
    updatedAt: response.updatedAt.toISOString(),
  };
}

export function mapPromptDetail(
  prompt: ClubPromptDetailSource,
  viewerState: ClubPromptViewerState,
): ClubPromptDetailDto {
  return {
    ...mapPromptSummary(prompt),
    archivedAt: prompt.archivedAt?.toISOString() ?? null,
    removedAt: prompt.removedAt?.toISOString() ?? null,
    removedById: prompt.removedById,
    removalReason: prompt.removalReason,
    responses: prompt.responses.map(mapPromptResponseSummary),
    viewerState,
  };
}
