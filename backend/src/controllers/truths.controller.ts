import { Request, Response } from 'express';
import {
  createTruth,
  createTruthCommentService,
  deleteTruthCommentService,
  deleteTruthService,
  getTruthCommentsService,
  updateTruthCommentService,
} from '../services/truths/truths.service';

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

export async function getTruthCommentsController(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const truthId = typeof req.params.id === 'string' ? req.params.id : '';

    if (!userId) {
      return res.status(401).json({
        error: 'Não autorizado',
      });
    }

    const comments = await getTruthCommentsService({
      truthId,
      userId,
    });

    return res.status(200).json(comments);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao buscar comentários';

    const status =
      message === 'Não autorizado'
        ? 401
        : message === 'Truth não encontrada'
          ? 404
          : 500;

    return res.status(status).json({
      error: message,
    });
  }
}

export async function createTruthCommentController(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user?.sub;
    const truthId = typeof req.params.id === 'string' ? req.params.id : '';
    const { text, parentId } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Não autorizado',
      });
    }

    const comment = await createTruthCommentService({
      truthId,
      userId,
      text,
      parentId: typeof parentId === 'string' ? parentId : undefined,
    });

    return res.status(201).json(comment);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao criar comentário';

    const status =
      message === 'Não autorizado'
        ? 401
        : message === 'Truth não encontrada' ||
            message === 'Comentário pai não encontrado'
          ? 404
          : message === 'Comentário é obrigatório' ||
              message.startsWith('Comentário deve ter no máximo') ||
              message === 'Não é possível responder uma resposta'
            ? 400
            : 500;

    return res.status(status).json({
      error: message,
    });
  }
}

export async function updateTruthCommentController(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user?.sub;
    const commentId =
      typeof req.params.id === 'string' ? req.params.id : '';
    const { text } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Não autorizado',
      });
    }

    const comment = await updateTruthCommentService({
      commentId,
      userId,
      text,
    });

    return res.status(200).json(comment);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao editar comentário';

    const status =
      message === 'Não autorizado'
        ? 403
        : message === 'Comentário não encontrado'
          ? 404
          : message === 'Comentário é obrigatório' ||
              message.startsWith('Comentário deve ter no máximo')
            ? 400
            : 500;

    return res.status(status).json({
      error: message,
    });
  }
}

export async function deleteTruthCommentController(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user?.sub;
    const commentId =
      typeof req.params.id === 'string' ? req.params.id : '';

    if (!userId) {
      return res.status(401).json({
        error: 'Não autorizado',
      });
    }

    await deleteTruthCommentService({
      commentId,
      userId,
    });

    return res.status(204).send();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao excluir comentário';

    const status =
      message === 'Não autorizado'
        ? 403
        : message === 'Comentário não encontrado'
          ? 404
          : 500;

    return res.status(status).json({
      error: message,
    });
  }
}
