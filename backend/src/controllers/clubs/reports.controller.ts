import { Request, Response } from 'express';
import { ClubServiceError } from '../../services/clubs/core/clubs.service';
import {
  createClubPromptCommentReport,
  createClubPromptReport,
  createClubPromptResponseReport,
  createClubReport,
} from '../../services/clubs/reports.service';

function getAuthenticatedUserId(req: Request) {
  return req.user?.sub ?? '';
}

function getClubId(req: Request) {
  return typeof req.params.id === 'string' ? req.params.id : '';
}

function getPromptId(req: Request) {
  return typeof req.params.promptId === 'string' ? req.params.promptId : '';
}

function getResponseId(req: Request) {
  return typeof req.params.responseId === 'string'
    ? req.params.responseId
    : '';
}

function getCommentId(req: Request) {
  return typeof req.params.commentId === 'string' ? req.params.commentId : '';
}

function handleClubReportControllerError(
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

export async function createClubReportController(
  req: Request,
  res: Response,
) {
  try {
    const report = await createClubReport({
      clubId: getClubId(req),
      reporterId: getAuthenticatedUserId(req),
      reason: req.body.reason,
      details: req.body.details,
    });

    return res.status(201).json(report);
  } catch (error) {
    return handleClubReportControllerError(
      res,
      error,
      'Erro interno ao denunciar clube',
    );
  }
}

export async function createClubPromptReportController(
  req: Request,
  res: Response,
) {
  try {
    const report = await createClubPromptReport({
      clubId: getClubId(req),
      promptId: getPromptId(req),
      reporterId: getAuthenticatedUserId(req),
      reason: req.body.reason,
      details: req.body.details,
    });

    return res.status(201).json(report);
  } catch (error) {
    return handleClubReportControllerError(
      res,
      error,
      'Erro interno ao denunciar prompt do clube',
    );
  }
}

export async function createClubPromptResponseReportController(
  req: Request,
  res: Response,
) {
  try {
    const report = await createClubPromptResponseReport({
      clubId: getClubId(req),
      promptId: getPromptId(req),
      responseId: getResponseId(req),
      reporterId: getAuthenticatedUserId(req),
      reason: req.body.reason,
      details: req.body.details,
    });

    return res.status(201).json(report);
  } catch (error) {
    return handleClubReportControllerError(
      res,
      error,
      'Erro interno ao denunciar resposta do prompt do clube',
    );
  }
}

export async function createClubPromptCommentReportController(
  req: Request,
  res: Response,
) {
  try {
    const report = await createClubPromptCommentReport({
      clubId: getClubId(req),
      promptId: getPromptId(req),
      commentId: getCommentId(req),
      reporterId: getAuthenticatedUserId(req),
      reason: req.body.reason,
      details: req.body.details,
    });

    return res.status(201).json(report);
  } catch (error) {
    return handleClubReportControllerError(
      res,
      error,
      'Erro interno ao denunciar comentario do prompt do clube',
    );
  }
}
