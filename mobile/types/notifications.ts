export type ClubNotificationType =
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
  | 'club_member_promoted';

export type FeedNotificationType =
  | 'feed_truth_received'
  | 'feed_dare_received'
  | 'feed_truth_comment'
  | 'feed_like'
  | 'feed_dare_proof_submitted';

export type AccountNotificationType = 'account_password_reset_completed';

export type NotificationType =
  | ClubNotificationType
  | FeedNotificationType
  | AccountNotificationType;

export type NotificationItem = {
  id: string;
  type: NotificationType;
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

export type ListNotificationsQuery = {
  limit?: number;
  cursor?: string | null;
  read?: boolean;
};

export type ListNotificationsResponse = {
  items: NotificationItem[];
  nextCursor: string | null;
};

export type UnreadNotificationsCount = {
  unreadCount: number;
};

export type MarkNotificationReadResponse = {
  notification: NotificationItem;
};

export type MarkAllNotificationsReadResponse = {
  updatedCount: number;
};

export type NotificationsContentState =
  | 'loading'
  | 'ready'
  | 'empty'
  | 'error';

export type NotificationPeriodGroupId = 'today' | 'this_week' | 'older';

export type NotificationPeriodGroup = {
  id: NotificationPeriodGroupId;
  title: string;
  items: NotificationItem[];
};

export type NotificationNavigationTarget =
  | {
      type: 'club';
      clubId: string;
    }
  | {
      type: 'unsupported';
    };
