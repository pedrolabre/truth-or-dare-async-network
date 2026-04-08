import { Request, Response } from 'express';
import {
  getMyProfile,
  listUsersForChallenge,
  updateMyProfile,
} from '../services/users.service';

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

export async function updateMyProfileController(req: Request, res: Response) {
  try {
    const userId = req.user?.sub ?? '';

    const { name, username, bio } = req.body;

    const updatedProfile = await updateMyProfile(userId, {
      name,
      username,
      bio,
    });

    return res.status(200).json(updatedProfile);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao atualizar perfil';

    const status =
      message === 'Usuário autenticado não encontrado'
        ? 400
        : message === 'Usuário não encontrado'
        ? 404
        : message === 'Nome inválido' ||
          message === 'Nenhum campo válido para atualização'
        ? 400
        : message === 'Username já está em uso'
        ? 409
        : 500;

    return res.status(status).json({
      error: message,
    });
  }
}