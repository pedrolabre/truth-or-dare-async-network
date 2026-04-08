import { Request, Response } from 'express';
import { getMyProfile, listUsersForChallenge } from '../services/users.service';

export async function listUsersController(req: Request, res: Response) {
  try {
    const currentUserId = req.user?.sub ?? '';
    const query =
      typeof req.query.query === 'string' ? req.query.query : undefined;

    const users = await listUsersForChallenge({
      currentUserId,
      query,
    });

    return res.status(200).json(users);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao listar usuários';

    const status =
      message === 'Usuário autenticado não encontrado' ? 400 : 500;

    return res.status(status).json({
      error: message,
    });
  }
}

export async function getMyProfileController(req: Request, res: Response) {
  try {
    const userId = req.user?.sub ?? '';

    const profile = await getMyProfile(userId);

    return res.status(200).json(profile);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao buscar perfil';

    const status =
      message === 'Usuário autenticado não encontrado'
        ? 400
        : message === 'Usuário não encontrado'
        ? 404
        : 500;

    return res.status(status).json({
      error: message,
    });
  }
}