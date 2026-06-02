import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  LOCAL_SETTINGS_SCHEMA_VERSION,
  type LocalSettings,
  type ThemeMode,
} from '../types/settings';

const AUTH_TOKEN_STORAGE_KEY = 'auth_token';
const LOCAL_SETTINGS_STORAGE_PREFIX = '@truth-or-dare/settings';
const ANONYMOUS_SETTINGS_NAMESPACE = 'anonymous';
const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function getDefaultSettings(): LocalSettings {
  return {
    schemaVersion: LOCAL_SETTINGS_SCHEMA_VERSION,
    themeMode: 'system',
    language: 'pt-BR',
    reduceMotion: false,
    largeText: false,
    highContrast: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function decodeBase64Url(value: string): string | null {
  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
  let decodedValue = '';
  let buffer = 0;
  let bitCount = 0;

  for (const character of normalizedValue.replace(/=+$/, '')) {
    const alphabetIndex = BASE64_ALPHABET.indexOf(character);

    if (alphabetIndex === -1) {
      return null;
    }

    buffer = (buffer << 6) | alphabetIndex;
    bitCount += 6;

    if (bitCount >= 8) {
      bitCount -= 8;
      decodedValue += String.fromCharCode((buffer >> bitCount) & 0xff);
    }
  }

  return decodedValue;
}

function getAuthenticatedUserId(token: string | null): string | null {
  if (!token) {
    return null;
  }

  const [, encodedPayload] = token.split('.');

  if (!encodedPayload) {
    return null;
  }

  try {
    const decodedPayload = decodeBase64Url(encodedPayload);

    if (!decodedPayload) {
      return null;
    }

    const payload = JSON.parse(decodedPayload) as { sub?: unknown };

    return typeof payload.sub === 'string' && payload.sub.trim()
      ? payload.sub.trim()
      : null;
  } catch {
    return null;
  }
}

function normalizeSettings(value: unknown): LocalSettings {
  if (!isRecord(value)) {
    return getDefaultSettings();
  }

  return {
    ...value,
    schemaVersion: LOCAL_SETTINGS_SCHEMA_VERSION,
    themeMode: isThemeMode(value.themeMode) ? value.themeMode : 'system',
    language: value.language === 'pt-BR' ? value.language : 'pt-BR',
    reduceMotion: isBoolean(value.reduceMotion) ? value.reduceMotion : false,
    largeText: isBoolean(value.largeText) ? value.largeText : false,
    highContrast: isBoolean(value.highContrast) ? value.highContrast : false,
  };
}

async function getSettingsStorageKey(): Promise<string> {
  let token: string | null = null;

  try {
    token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    token = null;
  }

  const userId = getAuthenticatedUserId(token);
  const namespace = userId
    ? `user/${encodeURIComponent(userId)}`
    : ANONYMOUS_SETTINGS_NAMESPACE;

  return `${LOCAL_SETTINGS_STORAGE_PREFIX}/${namespace}`;
}

async function loadSettingsByKey(storageKey: string): Promise<LocalSettings> {
  try {
    const storedValue = await AsyncStorage.getItem(storageKey);

    return storedValue
      ? normalizeSettings(JSON.parse(storedValue))
      : getDefaultSettings();
  } catch {
    return getDefaultSettings();
  }
}

export async function loadAllSettings(): Promise<LocalSettings> {
  const storageKey = await getSettingsStorageKey();

  return loadSettingsByKey(storageKey);
}

export async function saveSettings(
  partialSettings: Partial<LocalSettings>,
): Promise<void> {
  const storageKey = await getSettingsStorageKey();
  const currentSettings = await loadSettingsByKey(storageKey);
  const nextThemeMode = isThemeMode(partialSettings.themeMode)
    ? partialSettings.themeMode
    : currentSettings.themeMode;
  const nextSettings = normalizeSettings({
    ...currentSettings,
    ...partialSettings,
    themeMode: nextThemeMode,
  });

  try {
    await AsyncStorage.setItem(storageKey, JSON.stringify(nextSettings));
  } catch {
    return;
  }
}

export async function loadThemeMode(): Promise<ThemeMode> {
  const settings = await loadAllSettings();

  return settings.themeMode;
}

export async function loadThemeModePreference(): Promise<{
  themeMode: ThemeMode;
  hasStoredThemeMode: boolean;
}> {
  const storageKey = await getSettingsStorageKey();

  try {
    const storedValue = await AsyncStorage.getItem(storageKey);

    if (!storedValue) {
      return {
        themeMode: 'system',
        hasStoredThemeMode: false,
      };
    }

    const parsedValue = JSON.parse(storedValue);
    const normalizedSettings = normalizeSettings(parsedValue);

    return {
      themeMode: normalizedSettings.themeMode,
      hasStoredThemeMode:
        isRecord(parsedValue) && isThemeMode(parsedValue.themeMode),
    };
  } catch {
    return {
      themeMode: 'system',
      hasStoredThemeMode: false,
    };
  }
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  if (!isThemeMode(mode)) {
    return;
  }

  await saveSettings({ themeMode: mode });
}

export async function clearLocalSettings(): Promise<void> {
  const storageKey = await getSettingsStorageKey();

  try {
    await AsyncStorage.removeItem(storageKey);
  } catch {
    return;
  }
}
