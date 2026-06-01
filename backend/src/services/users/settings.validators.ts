import {
  invalidBioError,
  invalidIsPrivateError,
  invalidNameError,
  invalidUsernameError,
  noFieldsToUpdateError,
} from './settings.errors';

export type UpdateMyAccountInput = {
  name?: unknown;
  username?: unknown;
  bio?: unknown;
  isPrivate?: unknown;
};

export type ValidatedMyAccountUpdate = {
  name?: string;
  username?: string | null;
  bio?: string | null;
  isPrivate?: boolean;
};

function hasOwn(data: UpdateMyAccountInput, field: keyof UpdateMyAccountInput) {
  return Object.prototype.hasOwnProperty.call(data, field);
}

export function validateMyAccountUpdate(
  data: UpdateMyAccountInput,
): ValidatedMyAccountUpdate {
  const updateData: ValidatedMyAccountUpdate = {};

  if (hasOwn(data, 'name')) {
    if (typeof data.name !== 'string' || !data.name.trim()) {
      invalidNameError();
    }

    updateData.name = data.name.trim();
  }

  if (hasOwn(data, 'username')) {
    if (data.username !== null && typeof data.username !== 'string') {
      invalidUsernameError();
    }

    updateData.username =
      typeof data.username === 'string' ? data.username.trim() || null : null;
  }

  if (hasOwn(data, 'bio')) {
    if (data.bio !== null && typeof data.bio !== 'string') {
      invalidBioError();
    }

    updateData.bio =
      typeof data.bio === 'string' ? data.bio.trim() || null : null;
  }

  if (hasOwn(data, 'isPrivate')) {
    if (typeof data.isPrivate !== 'boolean') {
      invalidIsPrivateError();
    }

    updateData.isPrivate = data.isPrivate;
  }

  if (Object.keys(updateData).length === 0) {
    noFieldsToUpdateError();
  }

  return updateData;
}
