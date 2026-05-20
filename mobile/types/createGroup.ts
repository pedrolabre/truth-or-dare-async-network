import type { ClubVisibilityApi } from './clubsApi';

export type GroupIconName =
  | 'groups'
  | 'sports-esports'
  | 'local-fire-department'
  | 'auto-awesome'
  | 'celebration'
  | 'school'
  | 'nightlife'
  | 'favorite';

export type CreateGroupFriend = {
  id: string;
  name: string;
  username: string;
};

export type CreateGroupSubmitPayload = {
  name: string;
  description: string | null;
  iconName: GroupIconName;
  visibility: ClubVisibilityApi;
  rules: string | null;
  tags: string[];
  initialMemberIds: string[];
};
