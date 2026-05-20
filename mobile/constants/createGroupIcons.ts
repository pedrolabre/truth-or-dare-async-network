import type { GroupIconName } from '../types/createGroup';

export const CREATE_GROUP_ICON_OPTIONS = [
  'groups',
  'sports-esports',
  'local-fire-department',
  'auto-awesome',
  'celebration',
  'school',
  'nightlife',
  'favorite',
] as const satisfies readonly GroupIconName[];

export const DEFAULT_CREATE_GROUP_ICON_NAME: GroupIconName = 'groups';

export function isCreateGroupIconName(value: string): value is GroupIconName {
  return CREATE_GROUP_ICON_OPTIONS.includes(value as GroupIconName);
}
