import { Request, Response } from 'express';
import {
  archiveClub,
  ClubServiceError,
  createClub,
  discoverClubs,
  getClubDetails,
  listMyClubs,
  restoreClub,
  searchClubs,
  updateClub,
} from '../services/clubs.service';

function getAuthenticatedUserId(req: Request) {
  return req.user?.sub ?? '';
}

function getParamId(req: Request) {
  return typeof req.params.id === 'string' ? req.params.id : '';
}

function handleClubControllerError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof ClubServiceError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
  }

  const message = error instanceof Error ? error.message : fallbackMessage;

  return res.status(500).json({
    error: message,
  });
}

export async function createClubController(req: Request, res: Response) {
  try {
    const club = await createClub({
      creatorId: getAuthenticatedUserId(req),
      name: req.body.name,
      description: req.body.description,
      iconName: req.body.iconName,
      visibility: req.body.visibility,
      rules: req.body.rules,
      initialMemberIds: req.body.initialMemberIds,
      tags: req.body.tags,
    });

    return res.status(201).json(club);
  } catch (error) {
    return handleClubControllerError(res, error, 'Erro interno ao criar clube');
  }
}

export async function listMyClubsController(req: Request, res: Response) {
  try {
    const clubs = await listMyClubs(getAuthenticatedUserId(req));

    return res.status(200).json(clubs);
  } catch (error) {
    return handleClubControllerError(
      res,
      error,
      'Erro interno ao listar meus clubes',
    );
  }
}

export async function discoverClubsController(req: Request, res: Response) {
  try {
    const clubs = await discoverClubs(getAuthenticatedUserId(req));

    return res.status(200).json(clubs);
  } catch (error) {
    return handleClubControllerError(
      res,
      error,
      'Erro interno ao descobrir clubes',
    );
  }
}

export async function searchClubsController(req: Request, res: Response) {
  try {
    const clubs = await searchClubs({
      userId: getAuthenticatedUserId(req),
      query: req.query.query,
    });

    return res.status(200).json(clubs);
  } catch (error) {
    return handleClubControllerError(res, error, 'Erro interno ao buscar clubes');
  }
}

export async function getClubDetailsController(req: Request, res: Response) {
  try {
    const club = await getClubDetails({
      clubId: getParamId(req),
      userId: getAuthenticatedUserId(req),
    });

    return res.status(200).json(club);
  } catch (error) {
    return handleClubControllerError(res, error, 'Erro interno ao buscar clube');
  }
}

export async function updateClubController(req: Request, res: Response) {
  try {
    const club = await updateClub({
      clubId: getParamId(req),
      userId: getAuthenticatedUserId(req),
      name: req.body.name,
      description: req.body.description,
      iconName: req.body.iconName,
      visibility: req.body.visibility,
      rules: req.body.rules,
      tags: req.body.tags,
    });

    return res.status(200).json(club);
  } catch (error) {
    return handleClubControllerError(
      res,
      error,
      'Erro interno ao atualizar clube',
    );
  }
}

export async function archiveClubController(req: Request, res: Response) {
  try {
    await archiveClub({
      clubId: getParamId(req),
      userId: getAuthenticatedUserId(req),
    });

    return res.status(204).send();
  } catch (error) {
    return handleClubControllerError(
      res,
      error,
      'Erro interno ao arquivar clube',
    );
  }
}

export async function restoreClubController(req: Request, res: Response) {
  try {
    const club = await restoreClub({
      clubId: getParamId(req),
      userId: getAuthenticatedUserId(req),
    });

    return res.status(200).json(club);
  } catch (error) {
    return handleClubControllerError(
      res,
      error,
      'Erro interno ao restaurar clube',
    );
  }
}
