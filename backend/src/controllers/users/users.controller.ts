import { Request, Response } from 'express';
import {
  deleteMyAccount,
  getMyProfile,
  getPublicUserProfile,
  listUsersForChallenge,
  updateMyAccount,
  updateMyProfile,
} from '../../services/users/users.service';
import { UserSettingsServiceError } from '../../services/users/settings.errors';

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
    if (error instanceof UserSettingsServiceError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    }

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

export async function getPublicUserProfileController(
  req: Request,
  res: Response,
) {
  try {
    const userId = typeof req.params.id === 'string' ? req.params.id : '';
    const profile = await getPublicUserProfile(userId);

    return res.status(200).json(profile);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao buscar perfil publico';

    const status = message === 'Usuario nao encontrado' ? 404 : 500;

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
    if (error instanceof UserSettingsServiceError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    }

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

export async function patchMyAccountController(req: Request, res: Response) {
  try {
    const userId = req.user?.sub ?? '';
    const body = req.body ?? {};
    const { name, username, bio, isPrivate } = body;

    const updatedProfile = await updateMyAccount(userId, {
      ...(Object.prototype.hasOwnProperty.call(body, 'name')
        ? { name }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(body, 'username')
        ? { username }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(body, 'bio') ? { bio } : {}),
      ...(Object.prototype.hasOwnProperty.call(body, 'isPrivate')
        ? { isPrivate }
        : {}),
    });

    return res.status(200).json(updatedProfile);
  } catch (error) {
    if (error instanceof UserSettingsServiceError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    }

    return res.status(500).json({
      error: 'Erro interno ao atualizar configuracoes da conta',
    });
  }
}

export async function deleteMyAccountController(req: Request, res: Response) {
  try {
    const userId = req.user?.sub ?? '';
    const result = await deleteMyAccount(userId, req.body ?? {});

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof UserSettingsServiceError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    }

    return res.status(500).json({
      error: 'Erro interno ao excluir conta',
    });
  }
}
