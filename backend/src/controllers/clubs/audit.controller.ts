import { Request, Response } from 'express';
import { listClubAuditLogs } from '../../services/clubs/audit.service';
import { ClubServiceError } from '../../services/clubs/core/clubs.service';

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

function handleAuditControllerError(
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

  return res.status(500).json({
    error: error instanceof Error ? error.message : fallbackMessage,
  });
}

export async function listClubAuditLogsController(
  req: Request,
  res: Response,
) {
  try {
    const auditLogs = await listClubAuditLogs({
      clubId: getClubId(req),
      viewerId: getAuthenticatedUserId(req),
      limit: parseLimit(req.query.limit),
      cursor:
        typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
      action:
        typeof req.query.action === 'string' ? req.query.action : undefined,
      targetUserId:
        typeof req.query.targetUserId === 'string'
          ? req.query.targetUserId
          : undefined,
      entityType:
        typeof req.query.entityType === 'string'
          ? req.query.entityType
          : undefined,
      from: typeof req.query.from === 'string' ? req.query.from : undefined,
      to: typeof req.query.to === 'string' ? req.query.to : undefined,
    });

    return res.status(200).json(auditLogs);
  } catch (error) {
    return handleAuditControllerError(
      res,
      error,
      'Erro interno ao listar auditoria do clube',
    );
  }
}
