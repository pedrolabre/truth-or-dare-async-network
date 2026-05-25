export type NotificationTypeDto =
  | 'club_created'
  | 'club_invite_received'
  | 'club_invite_accepted'
  | 'club_join_request_received'
  | 'club_join_request_approved'
  | 'club_join_request_rejected'
  | 'club_new_prompt'
  | 'club_prompt_response'
  | 'club_prompt_comment'
  | 'club_mention'
  | 'club_member_promoted'
  | 'feed_truth_received'
  | 'feed_dare_received'
  | 'feed_truth_comment'
  | 'feed_like'
  | 'feed_dare_proof_submitted'
  | 'account_password_reset_completed';

export type NotificationItemDto = {
  id: string;
  type: NotificationTypeDto;
  title: string;
  body: string;
  deepLink: string;
  actorId: string | null;
  clubId: string | null;
  referenceType: string | null;
  referenceId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type ListNotificationsQueryDto = {
  limit?: number;
  cursor?: string;
  read?: boolean;
};

export type ListNotificationsResponseDto = {
  items: NotificationItemDto[];
  nextCursor: string | null;
};

export type UnreadNotificationsCountDto = {
  unreadCount: number;
};

export type MarkNotificationReadResponseDto = {
  notification: NotificationItemDto;
};

export type MarkAllNotificationsReadResponseDto = {
  updatedCount: number;
};
