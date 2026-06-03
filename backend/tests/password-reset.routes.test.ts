jest.mock('../src/services/auth/email.service', () =>
  jest.requireActual('../src/services/auth/email.mock'),
);

import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import {
  MAX_CODE_ATTEMPTS,
  createPasswordResetSessionToken,
} from '../src/services/auth/password-reset.tokens';
import {
  createTestPasswordResetToken,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';
import { getSentEmails, resetSentEmails } from '../src/services/auth/email.mock';
import { applyTestDatabaseHooks } from './test-db';
import { NotificationType } from '../src/generated/prisma/client';
import {
  getDailyMetrics,
  resetDailyMetrics,
} from '../src/services/observability/metrics';

type SentEmail = ReturnType<typeof getSentEmails>[number];

function extractResetCode(email: SentEmail): string {
  const source = email.text ?? email.html ?? '';
  const match = source.match(/\b(\d{6})\b/);

  if (!match) {
    throw new Error('Reset code not found in email content.');
  }

  return match[1];
}

function expectNoSensitiveFields(body: Record<string, unknown>) {
  expect(body).not.toHaveProperty('tokenHash');
  expect(body).not.toHaveProperty('passwordHash');
  expect(body).not.toHaveProperty('code');
}

describe('password-reset.routes', () => {
  applyTestDatabaseHooks({
    resetBeforeEach: false,
    resetAfterAll: false,
    disconnectAfterAll: false,
  });

  beforeEach(async () => {
    resetSentEmails();
    await resetFeedData({ deleteUsers: true });
  });

  afterAll(async () => {
    await resetFeedData({ deleteUsers: true });
    await prisma.$disconnect();
  });

  describe('POST /auth/forgot-password', () => {
    it('returns ok and creates token for existing email', async () => {
      const user = await createTestUser({
        email: 'reset-existing@test.com',
        password: 'StrongPass1',
      });

      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: user.email });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(response.body).not.toHaveProperty('resetToken');
      expectNoSensitiveFields(response.body);

      const emails = getSentEmails();
      expect(emails).toHaveLength(1);

      const code = extractResetCode(emails[0]);

      const tokens = await prisma.passwordResetToken.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(tokens).toHaveLength(1);

      const token = tokens[0];

      expect(token.attemptCount).toBe(0);
      expect(token.usedAt).toBeNull();
      expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(token.tokenHash).not.toBe(code);
      expect(token.tokenHash).toHaveLength(64);
    });

    it('invalidates previous active tokens for the same user', async () => {
      const user = await createTestUser({
        email: 'reset-invalidate@test.com',
        password: 'StrongPass1',
      });

      const previous = await createTestPasswordResetToken({
        userId: user.id,
        code: '123456',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: user.email });

      expect(response.status).toBe(200);

      const updatedPrevious = await prisma.passwordResetToken.findUnique({
        where: {
          id: previous.token.id,
        },
      });

      expect(updatedPrevious?.usedAt).not.toBeNull();

      const tokens = await prisma.passwordResetToken.findMany({
        where: {
          userId: user.id,
        },
      });

      expect(tokens).toHaveLength(2);
    });

    it('returns generic success for unknown email and does not create token', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'reset-missing@test.com' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });

      expect(getSentEmails()).toHaveLength(0);

      const tokenCount = await prisma.passwordResetToken.count();
      expect(tokenCount).toBe(0);
    });

    it('returns validation error for invalid email format', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        code: 'VALIDATION_ERROR',
      });
    });

    it('enforces rate limit per email and ip', async () => {
      const user = await createTestUser({
        email: 'reset-limit@test.com',
        password: 'StrongPass1',
      });

      const payload = { email: user.email };

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const response = await request(app)
          .post('/auth/forgot-password')
          .send(payload);

        expect(response.status).toBe(200);
      }

      const blocked = await request(app)
        .post('/auth/forgot-password')
        .send(payload);

      expect(blocked.status).toBe(429);
      expect(blocked.body).toMatchObject({
        code: 'RATE_LIMIT_EXCEEDED',
      });
    });
  });

  describe('POST /auth/verify-reset-code', () => {
    it('returns reset token for valid code', async () => {
      const user = await createTestUser({
        email: 'reset-verify@test.com',
        password: 'StrongPass1',
      });

      await request(app)
        .post('/auth/forgot-password')
        .send({ email: user.email });

      const emails = getSentEmails();
      expect(emails).toHaveLength(1);

      const code = extractResetCode(emails[0]);

      const response = await request(app)
        .post('/auth/verify-reset-code')
        .send({
          email: user.email,
          code,
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        resetToken: expect.any(String),
      });
      expect(response.body).not.toHaveProperty('tokenHash');
      expect(response.body).not.toHaveProperty('code');
    });

    it('enforces rate limit for verify-reset-code', async () => {
      const user = await createTestUser({
        email: 'reset-verify-rate@test.com',
        password: 'StrongPass1',
      });

      await request(app)
        .post('/auth/forgot-password')
        .send({ email: user.email });

      const emails = getSentEmails();
      expect(emails).toHaveLength(1);

      const code = extractResetCode(emails[0]);

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const response = await request(app)
          .post('/auth/verify-reset-code')
          .send({
            email: user.email,
            code,
          });

        expect(response.status).toBe(200);
      }

      const blocked = await request(app)
        .post('/auth/verify-reset-code')
        .send({
          email: user.email,
          code,
        });

      expect(blocked.status).toBe(429);
      expect(blocked.body).toMatchObject({
        code: 'RATE_LIMIT_EXCEEDED',
      });
    });

    it('increments attempt count for wrong code', async () => {
      const user = await createTestUser({
        email: 'reset-wrong-code@test.com',
        password: 'StrongPass1',
      });

      const seeded = await createTestPasswordResetToken({
        userId: user.id,
        code: '123456',
      });

      const response = await request(app)
        .post('/auth/verify-reset-code')
        .send({
          email: user.email,
          code: '000000',
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        code: 'INVALID_OR_EXPIRED_CODE',
      });

      const updated = await prisma.passwordResetToken.findUnique({
        where: {
          id: seeded.token.id,
        },
      });

      expect(updated?.attemptCount).toBe(1);
      expect(updated?.usedAt).toBeNull();
    });

    it('locks token after max attempts', async () => {
      const user = await createTestUser({
        email: 'reset-max-attempts@test.com',
        password: 'StrongPass1',
      });

      const seeded = await createTestPasswordResetToken({
        userId: user.id,
        code: '123456',
        attemptCount: MAX_CODE_ATTEMPTS - 1,
      });

      const response = await request(app)
        .post('/auth/verify-reset-code')
        .send({
          email: user.email,
          code: '000000',
        });

      expect(response.status).toBe(429);
      expect(response.body).toMatchObject({
        code: 'CODE_MAX_ATTEMPTS_REACHED',
      });

      const updated = await prisma.passwordResetToken.findUnique({
        where: {
          id: seeded.token.id,
        },
      });

      expect(updated?.attemptCount).toBe(MAX_CODE_ATTEMPTS);
      expect(updated?.usedAt).not.toBeNull();
    });

    it('returns invalid or expired for expired code', async () => {
      const user = await createTestUser({
        email: 'reset-expired@test.com',
        password: 'StrongPass1',
      });

      await createTestPasswordResetToken({
        userId: user.id,
        code: '123456',
        expiresAt: new Date(Date.now() - 1000),
      });

      const response = await request(app)
        .post('/auth/verify-reset-code')
        .send({
          email: user.email,
          code: '123456',
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        code: 'INVALID_OR_EXPIRED_CODE',
      });
    });

    it('returns invalid or expired for used token', async () => {
      const user = await createTestUser({
        email: 'reset-used@test.com',
        password: 'StrongPass1',
      });

      await createTestPasswordResetToken({
        userId: user.id,
        code: '123456',
        usedAt: new Date(),
      });

      const response = await request(app)
        .post('/auth/verify-reset-code')
        .send({
          email: user.email,
          code: '123456',
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        code: 'INVALID_OR_EXPIRED_CODE',
      });
    });

    it('returns invalid or expired for unknown email', async () => {
      const response = await request(app)
        .post('/auth/verify-reset-code')
        .send({
          email: 'reset-unknown@test.com',
          code: '123456',
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        code: 'INVALID_OR_EXPIRED_CODE',
      });
    });
  });

  describe('POST /auth/reset-password', () => {
    it('resets password and invalidates remaining tokens', async () => {
      const user = await createTestUser({
        email: 'reset-success@test.com',
        password: 'OldPass1',
      });

      const primary = await createTestPasswordResetToken({
        userId: user.id,
        code: '123456',
      });

      const secondary = await createTestPasswordResetToken({
        userId: user.id,
        code: '654321',
      });

      const resetToken = createPasswordResetSessionToken({
        userId: user.id,
        tokenId: primary.token.id,
      });

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          resetToken,
          newPassword: 'NovaSenha123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expectNoSensitiveFields(response.body);

      const updatedPrimary = await prisma.passwordResetToken.findUnique({
        where: {
          id: primary.token.id,
        },
      });

      const updatedSecondary = await prisma.passwordResetToken.findUnique({
        where: {
          id: secondary.token.id,
        },
      });

      expect(updatedPrimary?.usedAt).not.toBeNull();
      expect(updatedSecondary?.usedAt).not.toBeNull();

      const oldLogin = await request(app).post('/auth/login').send({
        email: user.email,
        password: 'OldPass1',
      });

      expect(oldLogin.status).toBe(400);
      expect(oldLogin.body).toHaveProperty('error');

      const newLogin = await request(app).post('/auth/login').send({
        email: user.email,
        password: 'NovaSenha123',
      });

      expect(newLogin.status).toBe(200);
      expect(newLogin.body).toHaveProperty('token');

      const emails = getSentEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0].subject).toBe('Senha redefinida com sucesso');

      const notification = await prisma.notification.findUnique({
        where: {
          dedupeKey: `account_password_reset_completed:${user.id}:${primary.token.id}`,
        },
      });

      expect(notification).toMatchObject({
        userId: user.id,
        actorId: null,
        type: NotificationType.account_password_reset_completed,
        deepLink: '/settings',
        referenceType: 'password_reset_token',
        referenceId: primary.token.id,
      });
    });

    it('registra observabilidade sem e-mail, codigo, token ou senha', async () => {
      resetDailyMetrics();
      const infoSpy = jest
        .spyOn(console, 'info')
        .mockImplementation(() => undefined);
      const warnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      try {
        const user = await createTestUser({
          email: 'reset-observability@test.com',
          password: 'OldPass1',
        });
        const newPassword = 'NovaSenha123';

        await request(app)
          .post('/auth/forgot-password')
          .send({ email: user.email });

        const emails = getSentEmails();
        const code = extractResetCode(emails[0]);

        const verifyResponse = await request(app)
          .post('/auth/verify-reset-code')
          .send({
            email: user.email,
            code,
          });

        const resetToken = verifyResponse.body.resetToken;

        await request(app)
          .post('/auth/reset-password')
          .send({
            resetToken,
            newPassword,
          });

        const serializedObservability = JSON.stringify({
          info: infoSpy.mock.calls,
          warn: warnSpy.mock.calls,
          metrics: getDailyMetrics(),
        });

        expect(serializedObservability).toContain(
          'password_reset.request_processed',
        );
        expect(serializedObservability).toContain('password_reset.code_verified');
        expect(serializedObservability).toContain('password_reset.completed');
        expect(serializedObservability).not.toContain(user.email);
        expect(serializedObservability).not.toContain(code);
        expect(serializedObservability).not.toContain(resetToken);
        expect(serializedObservability).not.toContain(newPassword);
      } finally {
        infoSpy.mockRestore();
        warnSpy.mockRestore();
        resetDailyMetrics();
      }
    });

    it('rejects invalid reset token', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          resetToken: 'invalid-token',
          newPassword: 'NovaSenha123',
        });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        code: 'RESET_TOKEN_INVALID',
      });
    });

    it('rejects expired password reset token', async () => {
      const user = await createTestUser({
        email: 'reset-expired-token@test.com',
        password: 'OldPass1',
      });

      const token = await createTestPasswordResetToken({
        userId: user.id,
        code: '123456',
        expiresAt: new Date(Date.now() - 1000),
      });

      const resetToken = createPasswordResetSessionToken({
        userId: user.id,
        tokenId: token.token.id,
      });

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          resetToken,
          newPassword: 'NovaSenha123',
        });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        code: 'RESET_TOKEN_INVALID',
      });
    });

    it('rejects already used password reset token', async () => {
      const user = await createTestUser({
        email: 'reset-used-token@test.com',
        password: 'OldPass1',
      });

      const token = await createTestPasswordResetToken({
        userId: user.id,
        code: '123456',
        usedAt: new Date(),
      });

      const resetToken = createPasswordResetSessionToken({
        userId: user.id,
        tokenId: token.token.id,
      });

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          resetToken,
          newPassword: 'NovaSenha123',
        });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        code: 'RESET_TOKEN_INVALID',
      });
    });

    it('rejects weak password', async () => {
      const user = await createTestUser({
        email: 'reset-weak-password@test.com',
        password: 'OldPass1',
      });

      const token = await createTestPasswordResetToken({
        userId: user.id,
        code: '123456',
      });

      const resetToken = createPasswordResetSessionToken({
        userId: user.id,
        tokenId: token.token.id,
      });

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          resetToken,
          newPassword: 'weak',
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        code: 'PASSWORD_TOO_WEAK',
      });
    });

    it('rejects when new password matches current password', async () => {
      const user = await createTestUser({
        email: 'reset-same-password@test.com',
        password: 'SamePass1',
      });

      const token = await createTestPasswordResetToken({
        userId: user.id,
        code: '123456',
      });

      const resetToken = createPasswordResetSessionToken({
        userId: user.id,
        tokenId: token.token.id,
      });

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          resetToken,
          newPassword: 'SamePass1',
        });

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        code: 'SAME_PASSWORD',
      });

      expect(getSentEmails()).toHaveLength(0);
    });

    it('enforces rate limit for reset-password', async () => {
      const resetToken = 'reset-rate-limit-token';

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const response = await request(app)
          .post('/auth/reset-password')
          .send({
            resetToken,
            newPassword: 'NovaSenha123',
          });

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({
          code: 'RESET_TOKEN_INVALID',
        });
      }

      const blocked = await request(app)
        .post('/auth/reset-password')
        .send({
          resetToken,
          newPassword: 'NovaSenha123',
        });

      expect(blocked.status).toBe(429);
      expect(blocked.body).toMatchObject({
        code: 'RATE_LIMIT_EXCEEDED',
      });
    });
  });
});
