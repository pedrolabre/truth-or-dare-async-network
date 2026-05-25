import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import {
  sendPasswordResetCodeEmail,
  sendPasswordResetConfirmationEmail,
} from './email.service';
import { createNotification } from '../notifications.service';
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

const MIN_REQUEST_PASSWORD_RESET_DURATION_MS = 200;

type PasswordResetLogLevel = 'info' | 'warn';

function logPasswordResetEvent(
  level: PasswordResetLogLevel,
  payload: Record<string, unknown>,
): void {
  const entry = {
    ...payload,
    timestamp: new Date().toISOString(),
  };

  if (level === 'warn') {
    console.warn(entry);
    return;
  }

  console.info(entry);
}

async function ensureMinimumDuration(
  startTimeMs: number,
  minDurationMs: number,
): Promise<void> {
  const elapsed = Date.now() - startTimeMs;

  if (elapsed >= minDurationMs) {
    return;
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, minDurationMs - elapsed);
  });
}

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
  const startedAt = Date.now();
  const normalizedIp = normalizeIpAddress(ipAddress);

  try {
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
      const noopCode = generateResetCode();
      hashResetCode(noopCode);

      logPasswordResetEvent('info', {
        event: 'password_reset.request_processed',
        ipAddress: normalizedIp,
        result: 'noop',
      });

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
      logPasswordResetEvent('warn', {
        event: 'password_reset.request_processed',
        userId: user.id,
        ipAddress: normalizedIp,
        result: 'rate_limited',
      });

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
        ipAddress: normalizedIp,
        attemptCount: 0,
      },
    });

    const emailResult = await sendPasswordResetCodeEmail({
      to: normalizedEmail,
      code,
      expiresInMinutes: RESET_CODE_TTL_MINUTES,
    });

    if (!emailResult.ok) {
      logPasswordResetEvent('warn', {
        event: 'password_reset.code_email_failed',
        userId: user.id,
        ipAddress: normalizedIp,
        reason: emailResult.reason,
      });
    }

    logPasswordResetEvent('info', {
      event: 'password_reset.request_processed',
      userId: user.id,
      ipAddress: normalizedIp,
      result: emailResult.ok ? 'email_sent' : 'email_failed',
    });

    return { ok: true };
  } finally {
    await ensureMinimumDuration(
      startedAt,
      MIN_REQUEST_PASSWORD_RESET_DURATION_MS,
    );
  }
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
    logPasswordResetEvent('warn', {
      event: 'password_reset.code_verification_failed',
      reason: 'invalid_or_expired',
    });
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
    logPasswordResetEvent('warn', {
      event: 'password_reset.code_verification_failed',
      userId: user.id,
      reason: 'invalid_or_expired',
    });
    invalidOrExpiredCodeError();
  }

  if (token.attemptCount >= MAX_CODE_ATTEMPTS) {
    logPasswordResetEvent('warn', {
      event: 'password_reset.code_verification_failed',
      userId: user.id,
      reason: 'max_attempts',
    });
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
      logPasswordResetEvent('warn', {
        event: 'password_reset.code_verification_failed',
        userId: user.id,
        reason: 'max_attempts',
      });
      codeMaxAttemptsReachedError();
    }

    logPasswordResetEvent('warn', {
      event: 'password_reset.code_verification_failed',
      userId: user.id,
      reason: 'invalid_or_expired',
    });
    invalidOrExpiredCodeError();
  }

  const resetToken = createPasswordResetSessionToken({
    userId: user.id,
    tokenId: token.id,
  });

  logPasswordResetEvent('info', {
    event: 'password_reset.code_verified',
    userId: user.id,
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
      email: true,
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

  logPasswordResetEvent('info', {
    event: 'password_reset.completed',
    userId: user.id,
  });

  await createNotification({
    userId: user.id,
    actorId: null,
    type: 'account_password_reset_completed',
    title: 'Senha redefinida',
    body: 'Sua senha foi redefinida com sucesso.',
    deepLink: '/settings',
    referenceType: 'password_reset_token',
    referenceId: token.id,
    dedupeKey: `account_password_reset_completed:${user.id}:${token.id}`,
  });

  const confirmationResult = await sendPasswordResetConfirmationEmail({
    to: user.email,
  });

  if (!confirmationResult.ok) {
    logPasswordResetEvent('warn', {
      event: 'password_reset.confirmation_email_failed',
      userId: user.id,
      reason: confirmationResult.reason,
    });
  }

  return { ok: true };
}
