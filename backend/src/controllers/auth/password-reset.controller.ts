import { Request, Response } from 'express';
import {
  requestPasswordReset,
  resetPassword,
  verifyResetCode,
} from '../../services/auth/password-reset.service';
import { PasswordResetServiceError } from '../../services/auth/password-reset.errors';

function getRequestIp(req: Request): string | undefined {
  if (typeof req.ip !== 'string') {
    return undefined;
  }

  const trimmed = req.ip.trim();

  return trimmed ? trimmed : undefined;
}

function handlePasswordResetControllerError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof PasswordResetServiceError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
  }

  return res.status(500).json({
    error: fallbackMessage,
  });
}

export async function forgotPasswordController(req: Request, res: Response) {
  try {
    const { email } = req.body;

    await requestPasswordReset({
      email,
      ipAddress: getRequestIp(req),
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    return handlePasswordResetControllerError(
      res,
      error,
      'Erro interno ao solicitar recuperacao de senha',
    );
  }
}

export async function verifyResetCodeController(req: Request, res: Response) {
  try {
    const { email, code } = req.body;

    const result = await verifyResetCode({
      email,
      code,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handlePasswordResetControllerError(
      res,
      error,
      'Erro interno ao verificar codigo de recuperacao',
    );
  }
}

export async function resetPasswordController(req: Request, res: Response) {
  try {
    const { resetToken, newPassword } = req.body;

    const result = await resetPassword({
      resetToken,
      newPassword,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handlePasswordResetControllerError(
      res,
      error,
      'Erro interno ao redefinir senha',
    );
  }
}
