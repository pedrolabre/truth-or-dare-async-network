import { MaterialIcons } from '@expo/vector-icons';
import type { ClubVisibilityApi } from './clubsApi';

export type GroupIconName = keyof typeof MaterialIcons.glyphMap;

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
