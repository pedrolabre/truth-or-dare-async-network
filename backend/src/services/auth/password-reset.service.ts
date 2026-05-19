import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { sendPasswordResetCodeEmail } from './email.service';
import {
  MAX_CODE_ATTEMPTS,
  MAX_REQUESTS_PER_EMAIL_PER_HOUR,
  RESET_CODE_TTL_MINUTES,
  RESET_REQUEST_WINDOW_MS,
  compareResetCode,
  createPasswordResetSessionToken,
  generateResetCode,
  getResetCodeExpiresAt,
  hashResetCode,
  verifyPasswordResetSessionToken,
} from './password-reset.tokens';
import {
  isStrongPassword,
  isValidEmail,
  isValidResetCode,
  normalizeEmail,
  normalizeResetCode,
} from './password-reset.validators';
import {
  codeMaxAttemptsReachedError,
  invalidOrExpiredCodeError,
  passwordTooWeakError,
  resetTokenInvalidError,
  samePasswordError,
  validationError,
} from './password-reset.errors';

export type RequestPasswordResetInput = {
  email: string;
  ipAddress?: string | null;
};

export type VerifyResetCodeInput = {
  email: string;
  code: string;
};

export type ResetPasswordInput = {
  resetToken: string;
  newPassword: string;
};

export type RequestPasswordResetResult = {
  ok: true;
};

export type VerifyResetCodeResult = {
  resetToken: string;
};

export type ResetPasswordResult = {
  ok: true;
};

function requireValidEmail(input: unknown): string {
  const normalized = normalizeEmail(input);

  if (!normalized || !isValidEmail(normalized)) {
    validationError('Invalid email');
  }

  return normalized;
}

function requireValidResetCode(input: unknown): string {
  const normalized = normalizeResetCode(input);

  if (!normalized || !isValidResetCode(normalized)) {
    validationError('Invalid reset code');
  }

  return normalized;
}

function requireStrongPassword(input: unknown): string {
  if (typeof input !== 'string' || !isStrongPassword(input)) {
    passwordTooWeakError();
  }

  return input;
}

function normalizeIpAddress(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();

  return trimmed ? trimmed : null;
}

export async function requestPasswordReset({
  email,
  ipAddress,
}: RequestPasswordResetInput): Promise<RequestPasswordResetResult> {
  const normalizedEmail = requireValidEmail(email);

  const user = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    return { ok: true };
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - RESET_REQUEST_WINDOW_MS);

  const recentRequests = await prisma.passwordResetToken.count({
    where: {
      userId: user.id,
      createdAt: {
        gte: windowStart,
      },
    },
  });

  if (recentRequests >= MAX_REQUESTS_PER_EMAIL_PER_HOUR) {
    return { ok: true };
  }

  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: {
        gt: now,
      },
    },
    data: {
      usedAt: now,
    },
  });

  const code = generateResetCode();
  const tokenHash = hashResetCode(code);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: getResetCodeExpiresAt(now),
      ipAddress: normalizeIpAddress(ipAddress),
      attemptCount: 0,
    },
  });

  await sendPasswordResetCodeEmail({
    to: normalizedEmail,
    code,
    expiresInMinutes: RESET_CODE_TTL_MINUTES,
  });

  return { ok: true };
}

export async function verifyResetCode({
  email,
  code,
}: VerifyResetCodeInput): Promise<VerifyResetCodeResult> {
  const normalizedEmail = requireValidEmail(email);
  const normalizedCode = requireValidResetCode(code);

  const user = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    invalidOrExpiredCodeError();
  }

  const now = new Date();

  const token = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: {
        gt: now,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!token) {
    invalidOrExpiredCodeError();
  }

  if (token.attemptCount >= MAX_CODE_ATTEMPTS) {
    codeMaxAttemptsReachedError();
  }

  const matches = compareResetCode(normalizedCode, token.tokenHash);

  if (!matches) {
    const nextAttemptCount = token.attemptCount + 1;
    const reachedLimit = nextAttemptCount >= MAX_CODE_ATTEMPTS;

    await prisma.passwordResetToken.update({
      where: {
        id: token.id,
      },
      data: {
        attemptCount: nextAttemptCount,
        ...(reachedLimit ? { usedAt: now } : {}),
      },
    });

    if (reachedLimit) {
      codeMaxAttemptsReachedError();
    }

    invalidOrExpiredCodeError();
  }

  const resetToken = createPasswordResetSessionToken({
    userId: user.id,
    tokenId: token.id,
  });

  return { resetToken };
}

export async function resetPassword({
  resetToken,
  newPassword,
}: ResetPasswordInput): Promise<ResetPasswordResult> {
  if (typeof resetToken !== 'string' || !resetToken.trim()) {
    resetTokenInvalidError();
  }

  const payload = verifyPasswordResetSessionToken(resetToken);

  if (!payload) {
    resetTokenInvalidError();
  }

  const now = new Date();

  const user = await prisma.user.findUnique({
    where: {
      id: payload.sub,
    },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    resetTokenInvalidError();
  }

  const token = await prisma.passwordResetToken.findFirst({
    where: {
      id: payload.tokenId,
      userId: user.id,
      usedAt: null,
      expiresAt: {
        gt: now,
      },
      attemptCount: {
        lt: MAX_CODE_ATTEMPTS,
      },
    },
  });

  if (!token) {
    resetTokenInvalidError();
  }

  const password = requireStrongPassword(newPassword);

  const isSamePassword = await bcrypt.compare(password, user.passwordHash);

  if (isSamePassword) {
    samePasswordError();
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash,
      },
    }),
    prisma.passwordResetToken.update({
      where: {
        id: token.id,
      },
      data: {
        usedAt: now,
      },
    }),
    prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: {
          gt: now,
        },
        id: {
          not: token.id,
        },
      },
      data: {
        usedAt: now,
      },
    }),
  ]);

  return { ok: true };
}
