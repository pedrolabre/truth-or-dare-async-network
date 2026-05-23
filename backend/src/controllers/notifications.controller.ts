import { Request, Response } from 'express';
import {
  countUnreadNotifications,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationServiceError,
} from '../services/notifications.service';

function getAuthenticatedUserId(req: Request) {
  return req.user?.sub ?? '';
}

function parseLimit(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseReadFilter(value: unknown) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

function handleNotificationControllerError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof NotificationServiceError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
  }

  return res.status(500).json({
    error: error instanceof Error ? error.message : fallbackMessage,
  });
}

export async function listNotificationsController(req: Request, res: Response) {
  try {
    const notifications = await listNotificationsForUser({
      userId: getAuthenticatedUserId(req),
      limit: parseLimit(req.query.limit),
      cursor: typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
      read: parseReadFilter(req.query.read),
    });

    return res.status(200).json(notifications);
  } catch (error) {
    return handleNotificationControllerError(
      res,
      error,
      'Erro interno ao listar notificacoes',
    );
  }
}

export async function unreadNotificationsCountController(
  req: Request,
  res: Response,
) {
  try {
    const count = await countUnreadNotifications(getAuthenticatedUserId(req));

    return res.status(200).json(count);
  } catch (error) {
    return handleNotificationControllerError(
      res,
      error,
      'Erro interno ao contar notificacoes',
    );
  }
}

export async function markNotificationReadController(
  req: Request,
  res: Response,
) {
  try {
    const result = await markNotificationRead({
      userId: getAuthenticatedUserId(req),
      notificationId: typeof req.params.id === 'string' ? req.params.id : '',
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleNotificationControllerError(
      res,
      error,
      'Erro interno ao marcar notificacao como lida',
    );
  }
}

export async function markAllNotificationsReadController(
  req: Request,
  res: Response,
) {
  try {
    const result = await markAllNotificationsRead(getAuthenticatedUserId(req));

    return res.status(200).json(result);
  } catch (error) {
    return handleNotificationControllerError(
      res,
      error,
      'Erro interno ao marcar notificacoes como lidas',
    );
  }
}
