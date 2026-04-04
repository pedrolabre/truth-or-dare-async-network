import { Request, Response } from 'express';
import { createTruth, deleteTruthService } from '../services/truths.service';

export async function createTruthController(req: Request, res: Response) {
  try {
    const authorId = req.user?.sub;
    const { content, targetUserId } = req.body;

    const truth = await createTruth({
      authorId: authorId ?? '',
      targetUserId: typeof targetUserId === 'string' ? targetUserId : '',
      content: typeof content === 'string' ? content : '',
    });

    return res.status(201).json(truth);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro interno ao criar truth';

    const status =
      message === 'Usuário autenticado não encontrado' ||
      message === 'Usuário alvo é obrigatório' ||
      message === 'Conteúdo é obrigatório'
        ? 400
        : 500;

    return res.status(status).json({
      error: message,
    });
  }
}

export async function deleteTruthController(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const id = typeof req.params.id === 'string' ? req.params.id : '';

    if (!userId) {
      return res.status(401).json({
        error: 'Não autorizado',
      });
    }

    await deleteTruthService({
      truthId: id,
      userId,
    });

    return res.status(204).send();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro interno ao deletar truth';

    const status =
      message === 'Truth não encontrada' || message === 'Não autorizado'
        ? 400
        : 500;

    return res.status(status).json({
      error: message,
    });
  }
}