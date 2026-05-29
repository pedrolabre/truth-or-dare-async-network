import { Request, Response } from 'express';
import {
  getRecommendedUsers,
  getTrendingClubs,
  searchClubs,
  SearchServiceError,
  searchUsers,
} from '../../services/search/search.service';

function getAuthenticatedUserId(req: Request) {
  return req.user?.sub ?? '';
}

function handleSearchControllerError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof SearchServiceError) {
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

function getPaginationQuery(req: Request) {
  const limit =
    typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
  const cursor =
    typeof req.query.cursor === 'string' ? req.query.cursor : undefined;

  return {
    limit,
    cursor,
  };
}

export async function searchUsersController(req: Request, res: Response) {
  try {
    const users = await searchUsers(req.query.query, {
      userId: getAuthenticatedUserId(req),
      ...getPaginationQuery(req),
    });

    return res.status(200).json(users);
  } catch (error) {
    return handleSearchControllerError(
      res,
      error,
      'Erro interno ao buscar usuarios',
    );
  }
}

export async function searchClubsController(req: Request, res: Response) {
  try {
    const clubs = await searchClubs(req.query.query, {
      userId: getAuthenticatedUserId(req),
      ...getPaginationQuery(req),
    });

    return res.status(200).json(clubs);
  } catch (error) {
    return handleSearchControllerError(
      res,
      error,
      'Erro interno ao buscar clubes',
    );
  }
}

export async function searchAllController(req: Request, res: Response) {
  try {
    const pagination = getPaginationQuery(req);
    const userId = getAuthenticatedUserId(req);
    const [users, clubs] = await Promise.all([
      searchUsers(req.query.query, {
        userId,
        ...pagination,
      }),
      searchClubs(req.query.query, {
        userId,
        ...pagination,
      }),
    ]);

    return res.status(200).json({
      users,
      clubs,
    });
  } catch (error) {
    return handleSearchControllerError(
      res,
      error,
      'Erro interno ao buscar resultados',
    );
  }
}

export async function getRecommendedUsersController(
  req: Request,
  res: Response,
) {
  try {
    const limit =
      typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const users = await getRecommendedUsers({
      userId: getAuthenticatedUserId(req),
      limit,
    });

    return res.status(200).json(users);
  } catch (error) {
    return handleSearchControllerError(
      res,
      error,
      'Erro interno ao buscar usuarios recomendados',
    );
  }
}

export async function getTrendingClubsController(
  req: Request,
  res: Response,
) {
  try {
    const limit =
      typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const clubs = await getTrendingClubs({
      userId: getAuthenticatedUserId(req),
      limit,
    });

    return res.status(200).json(clubs);
  } catch (error) {
    return handleSearchControllerError(
      res,
      error,
      'Erro interno ao buscar clubes em alta',
    );
  }
}
