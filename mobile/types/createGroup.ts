import type { ClubIconNameApi, ClubVisibilityApi } from './clubsApi';
import type { PickedImageFile } from '../services/mediaPicker';

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
  avatarDraft?: PickedImageFile | null;
  coverDraft?: PickedImageFile | null;
  visibility: ClubVisibilityApi;
  rules: string | null;
  tags: string[];
  initialMemberIds: string[];
};
