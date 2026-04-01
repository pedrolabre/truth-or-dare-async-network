import { Request, Response } from 'express';
import { createTruth } from '../services/truths.service';

export async function createTruthController(req: Request, res: Response) {
  try {
    const authorId = req.user?.sub;
    const { content } = req.body;

    const truth = await createTruth({
      authorId: authorId ?? '',
      content: typeof content === 'string' ? content : '',
    });

    return res.status(201).json(truth);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro interno ao criar truth';

    const status =
      message === 'Usuário autenticado não encontrado' ||
      message === 'Conteúdo é obrigatório'
        ? 400
        : 500;

    return res.status(status).json({
      error: message,
    });
  }
}