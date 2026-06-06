type ValidationFailure = (message: string) => never;

const MAX_MEDIA_URL_LENGTH = 2048;

function defaultValidationFailure(message: string): never {
  throw new Error(message);
}

function isValidHttpsUrl(value: string) {
  if (value.length > MAX_MEDIA_URL_LENGTH || /[\r\n]/.test(value)) {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === 'https:' &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function normalizeOptionalMediaUrl(
  value: unknown,
  fieldName: string,
  fail: ValidationFailure = defaultValidationFailure,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    fail(`${fieldName} deve ser uma URL https valida ou null`);
  }

  const normalizedUrl = value.trim();

  if (!normalizedUrl) {
    return null;
  }

  if (!isValidHttpsUrl(normalizedUrl)) {
    fail(`${fieldName} deve ser uma URL https valida ou null`);
  }

  return normalizedUrl;
}
