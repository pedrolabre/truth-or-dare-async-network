import { prisma } from '../../lib/prisma';
import {
  invalidPreferenceKeyError,
  invalidPreferenceValueError,
  noFieldsToUpdateError,
  userNotFoundError,
} from './settings.errors';

export type UserPreferenceKey =
  | 'themeMode'
  | 'language'
  | 'reduceMotion'
  | 'largeText'
  | 'highContrast';

export type UserPreferenceValues = {
  themeMode: 'system' | 'light' | 'dark';
  language: 'pt-BR';
  reduceMotion: boolean;
  largeText: boolean;
  highContrast: boolean;
};

export type UserPreferenceItem = {
  key: UserPreferenceKey;
  value: UserPreferenceValues[UserPreferenceKey];
  updatedAt: string | null;
};

export type UserPreferencesResponse = {
  preferences: UserPreferenceValues;
  items: UserPreferenceItem[];
};

type StoredPreference = {
  key: string;
  value: string;
  updatedAt: Date;
};

type UpdateUserPreferencesInput = {
  preferences?: unknown;
};

const PREFERENCE_KEYS = [
  'themeMode',
  'language',
  'reduceMotion',
  'largeText',
  'highContrast',
] as const satisfies readonly UserPreferenceKey[];

const DEFAULT_PREFERENCES: UserPreferenceValues = {
  themeMode: 'system',
  language: 'pt-BR',
  reduceMotion: false,
  largeText: false,
  highContrast: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPreferenceKey(value: string): value is UserPreferenceKey {
  return PREFERENCE_KEYS.includes(value as UserPreferenceKey);
}

function parseBoolean(value: string): boolean {
  return value === 'true';
}

function parseStoredValue(
  key: UserPreferenceKey,
  value: string,
): UserPreferenceValues[UserPreferenceKey] {
  if (key === 'reduceMotion' || key === 'largeText' || key === 'highContrast') {
    return parseBoolean(value);
  }

  return value as UserPreferenceValues[UserPreferenceKey];
}

function serializePreferenceValue(
  key: UserPreferenceKey,
  value: UserPreferenceValues[UserPreferenceKey],
): string {
  if (key === 'reduceMotion' || key === 'largeText' || key === 'highContrast') {
    return value ? 'true' : 'false';
  }

  return String(value);
}

function validatePreferenceValue(
  key: UserPreferenceKey,
  value: unknown,
): UserPreferenceValues[UserPreferenceKey] {
  if (
    key === 'themeMode' &&
    (value === 'system' || value === 'light' || value === 'dark')
  ) {
    return value;
  }

  if (key === 'language' && value === 'pt-BR') {
    return value;
  }

  if (
    (key === 'reduceMotion' || key === 'largeText' || key === 'highContrast') &&
    typeof value === 'boolean'
  ) {
    return value;
  }

  invalidPreferenceValueError();
}

function buildPreferencesResponse(
  storedPreferences: StoredPreference[],
): UserPreferencesResponse {
  const preferences: UserPreferenceValues = {
    ...DEFAULT_PREFERENCES,
  };
  const updatedAtByKey: Partial<Record<UserPreferenceKey, string>> = {};

  for (const preference of storedPreferences) {
    if (!isPreferenceKey(preference.key)) {
      continue;
    }

    preferences[preference.key] = parseStoredValue(
      preference.key,
      preference.value,
    ) as never;
    updatedAtByKey[preference.key] = preference.updatedAt.toISOString();
  }

  return {
    preferences,
    items: PREFERENCE_KEYS.map((key) => ({
      key,
      value: preferences[key],
      updatedAt: updatedAtByKey[key] ?? null,
    })),
  };
}

async function ensureActiveUser(userId: string) {
  if (!userId) {
    userNotFoundError();
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) {
    userNotFoundError();
  }
}

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferencesResponse> {
  await ensureActiveUser(userId);

  const storedPreferences = await prisma.userPreference.findMany({
    where: {
      userId,
    },
    select: {
      key: true,
      value: true,
      updatedAt: true,
    },
    orderBy: {
      key: 'asc',
    },
  });

  return buildPreferencesResponse(storedPreferences);
}

export async function updateUserPreferences(
  userId: string,
  input: UpdateUserPreferencesInput,
): Promise<UserPreferencesResponse> {
  await ensureActiveUser(userId);

  if (!isRecord(input.preferences)) {
    noFieldsToUpdateError();
  }

  const updateEntries = Object.entries(input.preferences).map(
    ([key, value]) => {
      if (!isPreferenceKey(key)) {
        invalidPreferenceKeyError();
      }

      return {
        key,
        value: validatePreferenceValue(key, value),
      };
    },
  );

  if (updateEntries.length === 0) {
    noFieldsToUpdateError();
  }

  await prisma.$transaction(
    updateEntries.map(({ key, value }) =>
      prisma.userPreference.upsert({
        where: {
          userId_key: {
            userId,
            key,
          },
        },
        update: {
          value: serializePreferenceValue(key, value),
        },
        create: {
          userId,
          key,
          value: serializePreferenceValue(key, value),
        },
      }),
    ),
  );

  return getUserPreferences(userId);
}
