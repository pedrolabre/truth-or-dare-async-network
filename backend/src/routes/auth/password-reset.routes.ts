import { Request, Router } from 'express';
import {
  forgotPasswordController,
  resetPasswordController,
  verifyResetCodeController,
} from '../../controllers/auth/password-reset.controller';
import {
  createRateLimiter,
  getRateLimitClientIp,
  hashRateLimitKey,
} from '../../middlewares/rate-limit.middleware';
import {
  RESET_CODE_TTL_MS,
  RESET_SESSION_TTL_MINUTES,
} from '../../services/auth/password-reset.tokens';
import { normalizeEmail } from '../../services/auth/password-reset.validators';

const router = Router();

const FORGOT_PASSWORD_RATE_LIMIT_MAX = 3;
const FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const VERIFY_RESET_CODE_RATE_LIMIT_MAX = 5;
const VERIFY_RESET_CODE_RATE_LIMIT_WINDOW_MS = RESET_CODE_TTL_MS;

const RESET_PASSWORD_RATE_LIMIT_MAX = 3;
const RESET_PASSWORD_RATE_LIMIT_WINDOW_MS =
  RESET_SESSION_TTL_MINUTES * 60 * 1000;

const forgotPasswordRateLimit = createRateLimiter({
  keyPrefix: 'password_reset:forgot',
  windowMs: FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS,
  max: FORGOT_PASSWORD_RATE_LIMIT_MAX,
  keyGenerator: (req: Request) => {
    const ipAddress = getRateLimitClientIp(req);
    const normalizedEmail = normalizeEmail(req.body?.email);

    return `${ipAddress}:${normalizedEmail || 'unknown'}`;
  },
});

const verifyResetCodeRateLimit = createRateLimiter({
  keyPrefix: 'password_reset:verify',
  windowMs: VERIFY_RESET_CODE_RATE_LIMIT_WINDOW_MS,
  max: VERIFY_RESET_CODE_RATE_LIMIT_MAX,
  keyGenerator: (req: Request) => {
    const ipAddress = getRateLimitClientIp(req);
    const normalizedEmail = normalizeEmail(req.body?.email);

    return `${ipAddress}:${normalizedEmail || 'unknown'}`;
  },
});

const resetPasswordRateLimit = createRateLimiter({
  keyPrefix: 'password_reset:reset',
  windowMs: RESET_PASSWORD_RATE_LIMIT_WINDOW_MS,
  max: RESET_PASSWORD_RATE_LIMIT_MAX,
  keyGenerator: (req: Request) => {
    const rawToken =
      typeof req.body?.resetToken === 'string'
        ? req.body.resetToken.trim()
        : '';

    if (rawToken) {
      return `token:${hashRateLimitKey(rawToken)}`;
    }

    return `ip:${getRateLimitClientIp(req)}`;
  },
});

router.post('/forgot-password', forgotPasswordRateLimit, forgotPasswordController);
router.post(
  '/verify-reset-code',
  verifyResetCodeRateLimit,
  verifyResetCodeController,
);
router.post('/reset-password', resetPasswordRateLimit, resetPasswordController);

export default router;
