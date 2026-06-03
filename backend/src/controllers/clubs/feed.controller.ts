import { Request, Response } from 'express';
import { ClubServiceError } from '../../services/clubs/core/clubs.service';
import {
  getClubFeed,
  markClubFeedSeen,
} from '../../services/clubs/feed/feed.service';
import { getClubsAggregatedFeed } from '../../services/clubs/feed/aggregated-feed.service';

function getAuthenticatedUserId(req: Request) {
  return req.user?.sub ?? '';
}

function getClubId(req: Request) {
  return typeof req.params.id === 'string' ? req.params.id : '';
}

function parseLimit(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? undefined : parsed;
}

function handleClubFeedControllerError(
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

export async function getClubFeedController(req: Request, res: Response) {
  try {
    const feed = await getClubFeed({
      clubId: getClubId(req),
      viewerId: getAuthenticatedUserId(req),
      order: req.query.order,
      limit: parseLimit(req.query.limit),
      cursor:
        typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
    });

    return res.status(200).json(feed);
  } catch (error) {
    return handleClubFeedControllerError(
      res,
      error,
      'Erro interno ao carregar feed do clube',
    );
  }
}

export async function getClubsAggregatedFeedController(
  req: Request,
  res: Response,
) {
  try {
    const feed = await getClubsAggregatedFeed({
      viewerId: getAuthenticatedUserId(req),
      limit: parseLimit(req.query.limit),
      cursor:
        typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
    });

    return res.status(200).json(feed);
  } catch (error) {
    return handleClubFeedControllerError(
      res,
      error,
      'Erro interno ao carregar feed dos clubes',
    );
  }
}

export async function markClubFeedSeenController(req: Request, res: Response) {
  try {
    const result = await markClubFeedSeen({
      clubId: getClubId(req),
      viewerId: getAuthenticatedUserId(req),
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleClubFeedControllerError(
      res,
      error,
      'Erro interno ao marcar feed do clube como visto',
    );
  }
}
