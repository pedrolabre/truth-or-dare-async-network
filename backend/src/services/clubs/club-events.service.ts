import { NotificationType } from '../../generated/prisma/client';
import {
  createNotification,
  CreateNotificationPayload,
} from '../notifications.service';

type ClubEventBase = {
  clubId: string;
  clubName: string;
  actorId?: string | null;
};

type ExplicitRecipientEvent = ClubEventBase & {
  recipientIds: string[];
};

type ClubCreatedEvent = ExplicitRecipientEvent & {
  creatorId: string;
};

type ClubInviteReceivedEvent = ClubEventBase & {
  inviteId: string;
  inviteeId: string;
  inviterId: string;
};

type ClubInviteAcceptedEvent = ClubEventBase & {
  inviteId: string;
  acceptedById: string;
  recipientIds: string[];
};

type ClubJoinRequestReceivedEvent = ExplicitRecipientEvent & {
  requestId: string;
  requesterId: string;
};

type ClubJoinRequestReviewedEvent = ClubEventBase & {
  requestId: string;
  requesterId: string;
  reviewerId: string;
};

type ClubNewPromptEvent = ExplicitRecipientEvent & {
  promptId: string;
  authorId: string;
};

type ClubPromptResponseEvent = ExplicitRecipientEvent & {
  promptId: string;
  responseId: string;
  responderId: string;
};

type ClubPromptCommentEvent = ExplicitRecipientEvent & {
  promptId: string;
  commentId: string;
  commenterId: string;
  responseId?: string | null;
};

type ClubMentionEvent = ClubEventBase & {
  mentionedUserIds: string[];
  mentionId: string;
  referenceType: string;
  referenceId: string;
  mentionedById: string;
  promptId?: string | null;
};

type ClubMemberPromotedEvent = ClubEventBase & {
  promotedUserId: string;
  promotedById: string;
  memberId: string;
  eventId: string;
  role: string;
};

type EmitNotificationsInput = {
  recipientIds: string[];
  payloadForRecipient: (recipientId: string) => CreateNotificationPayload;
};

function clubDeepLink(clubId: string) {
  return `/clubs/${clubId}`;
}

function promptDeepLink(clubId: string, promptId: string) {
  return `/clubs/${clubId}/prompts/${promptId}`;
}

function dedupeKey(type: NotificationType, recipientId: string, referenceId: string) {
  return `${type}:${recipientId}:${referenceId}`;
}

async function emitNotifications({
  recipientIds,
  payloadForRecipient,
}: EmitNotificationsInput) {
  const uniqueRecipientIds = [...new Set(recipientIds.filter(Boolean))];
  const notifications = await Promise.all(
    uniqueRecipientIds.map((recipientId) =>
      createNotification(payloadForRecipient(recipientId)),
    ),
  );

  return notifications.filter((notification) => notification !== null);
}

export async function emitClubCreatedEvent(event: ClubCreatedEvent) {
  return emitNotifications({
    recipientIds: event.recipientIds,
    payloadForRecipient: (recipientId) => ({
      userId: recipientId,
      actorId: event.actorId ?? event.creatorId,
      type: 'club_created',
      title: 'Clube criado',
      body: `O clube ${event.clubName} foi criado.`,
      deepLink: clubDeepLink(event.clubId),
      clubId: event.clubId,
      referenceType: 'club',
      referenceId: event.clubId,
      dedupeKey: dedupeKey('club_created', recipientId, event.clubId),
    }),
  });
}

export async function emitClubInviteReceivedEvent(
  event: ClubInviteReceivedEvent,
) {
  return createNotification({
    userId: event.inviteeId,
    actorId: event.inviterId,
    type: 'club_invite_received',
    title: 'Convite recebido',
    body: `Voce recebeu um convite para entrar em ${event.clubName}.`,
    deepLink: clubDeepLink(event.clubId),
    clubId: event.clubId,
    referenceType: 'club_invite',
    referenceId: event.inviteId,
    dedupeKey: dedupeKey(
      'club_invite_received',
      event.inviteeId,
      event.inviteId,
    ),
  });
}

export async function emitClubInviteAcceptedEvent(event: ClubInviteAcceptedEvent) {
  return emitNotifications({
    recipientIds: event.recipientIds,
    payloadForRecipient: (recipientId) => ({
      userId: recipientId,
      actorId: event.acceptedById,
      type: 'club_invite_accepted',
      title: 'Convite aceito',
      body: `Um convite para ${event.clubName} foi aceito.`,
      deepLink: clubDeepLink(event.clubId),
      clubId: event.clubId,
      referenceType: 'club_invite',
      referenceId: event.inviteId,
      dedupeKey: dedupeKey('club_invite_accepted', recipientId, event.inviteId),
    }),
  });
}

export async function emitClubJoinRequestReceivedEvent(
  event: ClubJoinRequestReceivedEvent,
) {
  return emitNotifications({
    recipientIds: event.recipientIds,
    payloadForRecipient: (recipientId) => ({
      userId: recipientId,
      actorId: event.requesterId,
      type: 'club_join_request_received',
      title: 'Nova solicitacao de entrada',
      body: `Alguem solicitou entrada em ${event.clubName}.`,
      deepLink: clubDeepLink(event.clubId),
      clubId: event.clubId,
      referenceType: 'club_join_request',
      referenceId: event.requestId,
      dedupeKey: dedupeKey(
        'club_join_request_received',
        recipientId,
        event.requestId,
      ),
    }),
  });
}

export async function emitClubJoinRequestApprovedEvent(
  event: ClubJoinRequestReviewedEvent,
) {
  return createNotification({
    userId: event.requesterId,
    actorId: event.reviewerId,
    type: 'club_join_request_approved',
    title: 'Solicitacao aprovada',
    body: `Sua entrada em ${event.clubName} foi aprovada.`,
    deepLink: clubDeepLink(event.clubId),
    clubId: event.clubId,
    referenceType: 'club_join_request',
    referenceId: event.requestId,
    dedupeKey: dedupeKey(
      'club_join_request_approved',
      event.requesterId,
      event.requestId,
    ),
  });
}

export async function emitClubJoinRequestRejectedEvent(
  event: ClubJoinRequestReviewedEvent,
) {
  return createNotification({
    userId: event.requesterId,
    actorId: event.reviewerId,
    type: 'club_join_request_rejected',
    title: 'Solicitacao rejeitada',
    body: `Sua entrada em ${event.clubName} foi rejeitada.`,
    deepLink: clubDeepLink(event.clubId),
    clubId: event.clubId,
    referenceType: 'club_join_request',
    referenceId: event.requestId,
    dedupeKey: dedupeKey(
      'club_join_request_rejected',
      event.requesterId,
      event.requestId,
    ),
  });
}

export async function emitClubNewPromptEvent(event: ClubNewPromptEvent) {
  return emitNotifications({
    recipientIds: event.recipientIds,
    payloadForRecipient: (recipientId) => ({
      userId: recipientId,
      actorId: event.authorId,
      type: 'club_new_prompt',
      title: 'Novo prompt no clube',
      body: `${event.clubName} tem um novo prompt.`,
      deepLink: promptDeepLink(event.clubId, event.promptId),
      clubId: event.clubId,
      referenceType: 'club_prompt',
      referenceId: event.promptId,
      dedupeKey: dedupeKey('club_new_prompt', recipientId, event.promptId),
    }),
  });
}

export async function emitClubPromptResponseEvent(
  event: ClubPromptResponseEvent,
) {
  return emitNotifications({
    recipientIds: event.recipientIds,
    payloadForRecipient: (recipientId) => ({
      userId: recipientId,
      actorId: event.responderId,
      type: 'club_prompt_response',
      title: 'Nova resposta',
      body: `Um prompt em ${event.clubName} recebeu uma resposta.`,
      deepLink: promptDeepLink(event.clubId, event.promptId),
      clubId: event.clubId,
      referenceType: 'club_prompt_response',
      referenceId: event.responseId,
      dedupeKey: dedupeKey('club_prompt_response', recipientId, event.responseId),
    }),
  });
}

export async function emitClubPromptCommentEvent(event: ClubPromptCommentEvent) {
  return emitNotifications({
    recipientIds: event.recipientIds,
    payloadForRecipient: (recipientId) => ({
      userId: recipientId,
      actorId: event.commenterId,
      type: 'club_prompt_comment',
      title: 'Novo comentario',
      body: `Um prompt em ${event.clubName} recebeu um comentario.`,
      deepLink: promptDeepLink(event.clubId, event.promptId),
      clubId: event.clubId,
      referenceType: 'club_prompt_comment',
      referenceId: event.commentId,
      dedupeKey: dedupeKey('club_prompt_comment', recipientId, event.commentId),
    }),
  });
}

export async function emitClubMentionEvent(event: ClubMentionEvent) {
  return emitNotifications({
    recipientIds: event.mentionedUserIds,
    payloadForRecipient: (recipientId) => ({
      userId: recipientId,
      actorId: event.mentionedById,
      type: 'club_mention',
      title: 'Voce foi mencionado',
      body: `Voce foi mencionado em ${event.clubName}.`,
      deepLink: event.promptId
        ? promptDeepLink(event.clubId, event.promptId)
        : clubDeepLink(event.clubId),
      clubId: event.clubId,
      referenceType: event.referenceType,
      referenceId: event.referenceId,
      dedupeKey: dedupeKey('club_mention', recipientId, event.mentionId),
    }),
  });
}

export async function emitClubMemberPromotedEvent(
  event: ClubMemberPromotedEvent,
) {
  return createNotification({
    userId: event.promotedUserId,
    actorId: event.promotedById,
    type: 'club_member_promoted',
    title: 'Papel atualizado',
    body: `Seu papel em ${event.clubName} foi atualizado para ${event.role}.`,
    deepLink: clubDeepLink(event.clubId),
    clubId: event.clubId,
    referenceType: 'club_member',
    referenceId: event.memberId,
    dedupeKey: dedupeKey(
      'club_member_promoted',
      event.promotedUserId,
      event.eventId,
    ),
  });
}
