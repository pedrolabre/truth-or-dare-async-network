import { MaterialIcons } from '@expo/vector-icons';

export type GroupIconName = keyof typeof MaterialIcons.glyphMap;

export type CreateGroupFriend = {
  id: string;
  name: string;
  username: string;
};

export type CreateGroupSubmitPayload = {
  name: string;
  description: string;
  selectedMembers: string[];
  selectedIcon: GroupIconName;
};