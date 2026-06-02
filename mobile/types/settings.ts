export const LOCAL_SETTINGS_SCHEMA_VERSION = 1;

export type ThemeMode = 'system' | 'light' | 'dark';

export type LocalSettings = {
  schemaVersion: number;
  themeMode: ThemeMode;
  [preference: string]: unknown;
};

export type SettingsState = {
  privateAccountEnabled: boolean;
};

export type UserAccountData = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isPrivate: boolean;
  createdAt: string;
};

export type ChangeEmailPayload = {
  newEmail: string;
  currentPassword: string;
};

export type ChangeEmailForm = ChangeEmailPayload & {
  confirmEmail: string;
};

export type ChangeEmailFieldErrors = Partial<
  Record<keyof ChangeEmailForm, string>
>;

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordForm = ChangePasswordPayload & {
  confirmNewPassword: string;
};

export type ChangePasswordFieldErrors = Partial<
  Record<keyof ChangePasswordForm, string>
>;

export type UpdateAccountPayload = {
  name?: string;
  username?: string | null;
  bio?: string | null;
  isPrivate?: boolean;
};
