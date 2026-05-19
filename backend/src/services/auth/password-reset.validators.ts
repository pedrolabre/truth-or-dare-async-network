const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_CODE_REGEX = /^\d{6}$/;

export const MIN_PASSWORD_LENGTH = 8;

export function normalizeEmail(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function normalizeResetCode(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input.trim();
}

export function isValidResetCode(code: string): boolean {
  return RESET_CODE_REGEX.test(code);
}

export function isStrongPassword(password: string): boolean {
  if (typeof password !== 'string') {
    return false;
  }

  return (
    password.length >= MIN_PASSWORD_LENGTH &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}
