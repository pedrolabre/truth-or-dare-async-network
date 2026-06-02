import { Request, Response } from 'express';
import {
  getUserPreferences,
  updateUserPreferences,
} from '../../services/users/preferences.service';
import { UserSettingsServiceError } from '../../services/users/settings.errors';

export async function getUserPreferencesController(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user?.sub ?? '';
    const preferences = await getUserPreferences(userId);

    return res.status(200).json(preferences);
  } catch (error) {
    if (error instanceof UserSettingsServiceError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    }

    return res.status(500).json({
      error: 'Erro interno ao buscar preferencias',
    });
  }
}

export async function updateUserPreferencesController(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user?.sub ?? '';
    const preferences = await updateUserPreferences(userId, req.body ?? {});

    return res.status(200).json(preferences);
  } catch (error) {
    if (error instanceof UserSettingsServiceError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    }

    return res.status(500).json({
      error: 'Erro interno ao atualizar preferencias',
    });
  }
}
