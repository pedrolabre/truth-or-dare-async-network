export const LOCAL_SETTINGS_SCHEMA_VERSION = 1;

export type ThemeMode = 'system' | 'light' | 'dark';

export type UserPreferences = {
  themeMode: ThemeMode;
  language: 'pt-BR';
  reduceMotion: boolean;
  largeText: boolean;
  highContrast: boolean;
};

export type UserPreferenceKey = keyof UserPreferences;

export type UserPreferenceItem = {
  [Key in UserPreferenceKey]: {
    key: Key;
    value: UserPreferences[Key];
    updatedAt: string | null;
  };
}[UserPreferenceKey];

export type UserPreferencesResponse = {
  preferences: UserPreferences;
  items: UserPreferenceItem[];
};

export type UpdateUserPreferencesPayload = Partial<UserPreferences>;

export type LocalSettings = {
  schemaVersion: number;
  themeMode: ThemeMode;
  language: 'pt-BR';
  reduceMotion: boolean;
  largeText: boolean;
  highContrast: boolean;
  [preference: string]: unknown;
};

export type SettingsState = {
  privateAccountEnabled: boolean;
};

export type AppInfo = {
  apiVersion: string;
  environment: string;
  status: 'ok';
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

export type DeleteAccountPayload = {
  currentPassword: string;
};

export type DeleteAccountForm = DeleteAccountPayload;

export type DeleteAccountFieldErrors = Partial<
  Record<keyof DeleteAccountForm, string>
>;

export const REPORT_ABUSE_CATEGORIES = [
  'spam',
  'hate',
  'violence',
  'nudity',
  'other',
] as const;

export type ReportAbuseCategory =
  (typeof REPORT_ABUSE_CATEGORIES)[number];

export type ReportAbusePayload = {
  category: ReportAbuseCategory;
  description: string;
  referenceId?: string;
  referenceType?: string;
};

export type ReportAbuseForm = ReportAbusePayload;

export type ReportAbuseFieldErrors = Partial<
  Record<keyof ReportAbuseForm, string>
>;

export type ReportAbuseResponse = {
  ticket: {
    id: string;
    userId: string;
    category: ReportAbuseCategory;
    description: string;
    referenceId: string | null;
    referenceType: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type UpdateAccountPayload = {
  name?: string;
  username?: string | null;
  bio?: string | null;
  isPrivate?: boolean;
};
