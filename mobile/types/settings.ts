export const LOCAL_SETTINGS_SCHEMA_VERSION = 1;

export type ThemeMode = 'system' | 'light' | 'dark';

export type LocalSettings = {
  schemaVersion: number;
  themeMode: ThemeMode;
  [preference: string]: unknown;
};
