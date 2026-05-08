import { Request, Response } from 'express';
import {
  createTruthCommentReportService,
  createTruthReportService,
} from '../services/truth-reports.service';

function getReportStatusFromMessage(message: string) {
  if (message === 'Não autorizado') {
    return 401;
  }

  if (
    message === 'Truth não encontrada' ||
    message === 'Comentário não encontrado'
  ) {
    return 404;
  }

  if (message === 'Denúncia já registrada') {
    return 409;
  }

  if (
    message === 'Motivo da denúncia é obrigatório' ||
    message === 'Motivo da denúncia é inválido' ||
    message === 'Detalhes da denúncia devem ser um texto' ||
    message.startsWith('Detalhes da denúncia devem ter no máximo') ||
    message === 'Não é possível denunciar sua própria truth' ||
    message === 'Não é possível denunciar seu próprio comentário'
  ) {
    return 400;
  }

  return 500;
}

export async function createTruthReportController(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user?.sub;
    const truthId = typeof req.params.id === 'string' ? req.params.id : '';
    const { reason, details } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Não autorizado',
      });
    }

    const report = await createTruthReportService({
      truthId,
      userId,
      reason,
      details,
    });

    return res.status(201).json(report);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao denunciar truth';

    return res.status(getReportStatusFromMessage(message)).json({
      error: message,
    });
  }
}

export async function createTruthCommentReportController(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user?.sub;
    const commentId =
      typeof req.params.id === 'string' ? req.params.id : '';
    const { reason, details } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Não autorizado',
      });
    }

    const report = await createTruthCommentReportService({
      commentId,
      userId,
      reason,
      details,
    });

    return res.status(201).json(report);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao denunciar comentário';

    return res.status(getReportStatusFromMessage(message)).json({
      error: message,
    });
  }
}