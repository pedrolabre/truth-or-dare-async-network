import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptStatus,
  ClubStatus,
  ClubVisibility,
} from '../generated/prisma/client';
import { ClubPromptDetailDto } from '../dtos/clubs.dto';

export const CLUB_PROMPT_AUTHOR_EDIT_WINDOW_MINUTES = 15;

type PromptMembership = {
  userId: string;
  status: ClubMemberStatus;
  role: ClubMemberRole;
};

type PromptClubAccess = {
  status: ClubStatus;
  visibility: ClubVisibility;
};

type PromptPermissionTarget = {
  authorId: string;
  status: ClubPromptStatus;
  archivedAt: Date | null;
  removedAt: Date | null;
  createdAt: Date;
};

export function getActivePromptMembership<T extends PromptMembership>(
  members: T[],
  userId: string,
) {
  const membership = members.find((member) => member.userId === userId);

  if (membership?.status !== ClubMemberStatus.active) {
    return null;
  }

  return membership;
}

export function isPromptManagerRole(role: ClubMemberRole | undefined) {
  return (
    role === ClubMemberRole.owner ||
    role === ClubMemberRole.admin ||
    role === ClubMemberRole.moderator
  );
}

export function isPromptEditorRole(role: ClubMemberRole | undefined) {
  return role === ClubMemberRole.owner || role === ClubMemberRole.admin;
}

export function canViewPromptClub(
  club: PromptClubAccess,
  membership: PromptMembership | null,
) {
  return (
    (club.visibility === ClubVisibility.public && club.status === ClubStatus.active) ||
    Boolean(membership)
  );
}

function isPromptAvailable(prompt: PromptPermissionTarget) {
  return (
    prompt.status === ClubPromptStatus.published &&
    !prompt.archivedAt &&
    !prompt.removedAt
  );
}

function isInsideAuthorEditWindow(prompt: PromptPermissionTarget, now: Date) {
  const windowMs = CLUB_PROMPT_AUTHOR_EDIT_WINDOW_MINUTES * 60 * 1000;

  return now.getTime() - prompt.createdAt.getTime() <= windowMs;
}

export function canAnswerPrompt({
  club,
  prompt,
  membership,
}: {
  club: Pick<PromptClubAccess, 'status'>;
  prompt: PromptPermissionTarget;
  membership: PromptMembership | null;
}) {
  return (
    Boolean(membership) &&
    club.status === ClubStatus.active &&
    isPromptAvailable(prompt)
  );
}

export function canEditPrompt({
  club,
  prompt,
  membership,
  viewerId,
  hasResponses,
  now = new Date(),
}: {
  club: Pick<PromptClubAccess, 'status'>;
  prompt: PromptPermissionTarget;
  membership: PromptMembership | null;
  viewerId: string;
  hasResponses: boolean;
  now?: Date;
}) {
  if (!canAnswerPrompt({ club, prompt, membership })) {
    return false;
  }

  if (isPromptEditorRole(membership?.role)) {
    return true;
  }

  return (
    prompt.authorId === viewerId &&
    !hasResponses &&
    isInsideAuthorEditWindow(prompt, now)
  );
}

export function canRemovePrompt({
  club,
  prompt,
  membership,
  viewerId,
}: {
  club: Pick<PromptClubAccess, 'status'>;
  prompt: PromptPermissionTarget;
  membership: PromptMembership | null;
  viewerId: string;
}) {
  return (
    canAnswerPrompt({ club, prompt, membership }) &&
    (prompt.authorId === viewerId || isPromptManagerRole(membership?.role))
  );
}

export function buildPromptViewerState({
  club,
  prompt,
  membership,
  viewerId,
  likedByMe,
  answeredByMe,
}: {
  club: Pick<PromptClubAccess, 'status'>;
  prompt: PromptPermissionTarget;
  membership: PromptMembership | null;
  viewerId: string;
  likedByMe: boolean;
  answeredByMe: boolean;
}): ClubPromptDetailDto['viewerState'] {
  return {
    likedByMe,
    answeredByMe,
    canAnswer: canAnswerPrompt({ club, prompt, membership }),
    canEdit: canEditPrompt({
      club,
      prompt,
      membership,
      viewerId,
      hasResponses: answeredByMe,
    }),
    canRemove: canRemovePrompt({
      club,
      prompt,
      membership,
      viewerId,
    }),
  };
}
