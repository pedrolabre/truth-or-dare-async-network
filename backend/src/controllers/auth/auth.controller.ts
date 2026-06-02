import { Request, Response } from 'express';
import {
  changeEmail,
  changePassword,
  login,
  signup,
} from '../../services/auth/auth.service';
import { AccountSettingsServiceError } from '../../services/auth/settings.errors';

function handleAccountSettingsControllerError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof AccountSettingsServiceError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
  }

  return res.status(500).json({
    error: fallbackMessage,
  });
}

export async function signupController(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;

    const result = await signup({
      name,
      email,
      password,
    });

    return res.status(201).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro interno no cadastro';

    return res.status(400).json({
      error: message,
    });
  }
}

export async function loginController(req: Request, res: Response) {
  try {
    const { email, password, deviceName, platform } = req.body;
    const forwardedFor = req.headers['x-forwarded-for'];
    const ipAddress = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0] ?? req.ip ?? null;

    const result = await login({
      email,
      password,
      deviceName,
      platform,
      ipAddress,
    });

    return res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro interno no login';

    return res.status(400).json({
      error: message,
    });
  }
}

export async function changeEmailController(req: Request, res: Response) {
  try {
    const userId = req.user?.sub ?? '';
    const { newEmail, currentPassword } = req.body ?? {};
    const result = await changeEmail({
      userId,
      newEmail,
      currentPassword,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleAccountSettingsControllerError(
      res,
      error,
      'Erro interno ao alterar e-mail',
    );
  }
}

export async function changePasswordController(req: Request, res: Response) {
  try {
    const userId = req.user?.sub ?? '';
    const { currentPassword, newPassword } = req.body ?? {};
    const result = await changePassword({
      userId,
      currentPassword,
      newPassword,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleAccountSettingsControllerError(
      res,
      error,
      'Erro interno ao alterar senha',
    );
  }
}
