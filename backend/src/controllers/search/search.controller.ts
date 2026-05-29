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

type SearchLogPayload = {
  searchType: 'users' | 'clubs' | 'unified';
  userId: string;
  startedAt: number;
  query: unknown;
  limit?: number;
  cursor?: string;
  resultCount: number;
  nextCursorPresent: boolean;
  usersResultCount?: number;
  clubsResultCount?: number;
};

function getQueryLength(query: unknown) {
  return typeof query === 'string' ? query.trim().length : 0;
}

function logSearchQuery({
  searchType,
  userId,
  startedAt,
  query,
  limit,
  cursor,
  resultCount,
  nextCursorPresent,
  usersResultCount,
  clubsResultCount,
}: SearchLogPayload) {
  console.info({
    event: 'search.query_executed',
    timestamp: new Date().toISOString(),
    searchType,
    userId,
    queryLength: getQueryLength(query),
    limit: limit ?? null,
    cursorPresent: Boolean(cursor),
    resultCount,
    usersResultCount,
    clubsResultCount,
    nextCursorPresent,
    durationMs: Date.now() - startedAt,
  });
}

export async function searchUsersController(req: Request, res: Response) {
  const startedAt = Date.now();

  try {
    const pagination = getPaginationQuery(req);
    const users = await searchUsers(req.query.query, {
      userId: getAuthenticatedUserId(req),
      ...pagination,
    });

    logSearchQuery({
      searchType: 'users',
      userId: getAuthenticatedUserId(req),
      startedAt,
      query: req.query.query,
      ...pagination,
      resultCount: users.items.length,
      nextCursorPresent: Boolean(users.nextCursor),
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
  const startedAt = Date.now();

  try {
    const pagination = getPaginationQuery(req);
    const clubs = await searchClubs(req.query.query, {
      userId: getAuthenticatedUserId(req),
      ...pagination,
    });

    logSearchQuery({
      searchType: 'clubs',
      userId: getAuthenticatedUserId(req),
      startedAt,
      query: req.query.query,
      ...pagination,
      resultCount: clubs.items.length,
      nextCursorPresent: Boolean(clubs.nextCursor),
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
  const startedAt = Date.now();

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

    logSearchQuery({
      searchType: 'unified',
      userId,
      startedAt,
      query: req.query.query,
      ...pagination,
      resultCount: users.items.length + clubs.items.length,
      usersResultCount: users.items.length,
      clubsResultCount: clubs.items.length,
      nextCursorPresent: Boolean(users.nextCursor || clubs.nextCursor),
    });

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
