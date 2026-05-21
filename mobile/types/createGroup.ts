import type { ClubIconNameApi, ClubVisibilityApi } from './clubsApi';

export type GroupIconName = ClubIconNameApi;

export type CreateGroupMemberOption = {
  id: string;
  name: string;
  email: string;
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
