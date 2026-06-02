import { Request, Response } from 'express';
import {
  listUserSessions,
  revokeOtherUserSessions,
  revokeUserSession,
} from '../../services/users/sessions.service';
import { UserSettingsServiceError } from '../../services/users/settings.errors';

function handleSessionsControllerError(res: Response, error: unknown) {
  if (error instanceof UserSettingsServiceError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
  }

  return res.status(500).json({
    error: 'Erro interno ao gerenciar sessoes',
  });
}

export async function listUserSessionsController(req: Request, res: Response) {
  try {
    const result = await listUserSessions({
      userId: req.user?.sub ?? '',
      currentSessionId: req.user?.sessionId,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleSessionsControllerError(res, error);
  }
}

export async function revokeUserSessionController(req: Request, res: Response) {
  try {
    const idParam = req.params.id;
    const sessionId = Array.isArray(idParam) ? idParam[0] : idParam ?? '';
    const result = await revokeUserSession({
      userId: req.user?.sub ?? '',
      sessionId,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleSessionsControllerError(res, error);
  }
}

export async function revokeOtherUserSessionsController(
  req: Request,
  res: Response,
) {
  try {
    const result = await revokeOtherUserSessions({
      userId: req.user?.sub ?? '',
      currentSessionId: req.user?.sessionId,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleSessionsControllerError(res, error);
  }
}
