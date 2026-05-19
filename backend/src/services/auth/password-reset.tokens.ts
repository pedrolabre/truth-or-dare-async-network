import crypto from 'crypto';
import {
  generatePasswordResetToken,
  verifyPasswordResetToken,
  type PasswordResetTokenPayload,
} from '../../utils/jwt';

export const RESET_CODE_TTL_MINUTES = 15;
export const RESET_CODE_TTL_MS = RESET_CODE_TTL_MINUTES * 60 * 1000;
export const RESET_REQUEST_WINDOW_MS = 60 * 60 * 1000;
export const MAX_CODE_ATTEMPTS = 5;
export const MAX_REQUESTS_PER_EMAIL_PER_HOUR = 3;
export const RESET_SESSION_TTL_MINUTES = 10;

const RESET_CODE_MIN = 0;
const RESET_CODE_MAX = 1_000_000;

export function generateResetCode(): string {
  const value = crypto.randomInt(RESET_CODE_MIN, RESET_CODE_MAX);
  return String(value).padStart(6, '0');
}

export function hashResetCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function compareResetCode(code: string, storedHash: string): boolean {
  const computedHash = hashResetCode(code);

  if (computedHash.length !== storedHash.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(storedHash, 'hex'),
    );
  } catch {
    return false;
  }
}

export function getResetCodeExpiresAt(now: Date = new Date()): Date {
  return new Date(now.getTime() + RESET_CODE_TTL_MS);
}

export function createPasswordResetSessionToken(input: {
  userId: string;
  tokenId: string;
}): string {
  return generatePasswordResetToken(
    {
      sub: input.userId,
      tokenId: input.tokenId,
    },
    `${RESET_SESSION_TTL_MINUTES}m`,
  );
}

export function verifyPasswordResetSessionToken(
  token: string,
): PasswordResetTokenPayload | null {
  try {
    return verifyPasswordResetToken(token);
  } catch {
    return null;
  }
}
