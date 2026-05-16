import { Request, Response } from 'express';
import { ClubServiceError } from '../services/clubs/core/clubs.service';
import { createClubPromptComment } from '../services/clubs/prompts/comments.service';
import {
  createClubPrompt,
  getClubPromptDetail,
} from '../services/clubs/prompts/prompts.service';
import { updateClubPrompt } from '../services/clubs/prompts/edit.service';
import { moderateClubPrompt } from '../services/clubs/prompts/moderation.service';
import {
  toggleClubPromptLike,
  toggleClubPromptResponseLike,
} from '../services/clubs/prompts/likes.service';
import { listClubPromptResponses } from '../services/clubs/prompts/responses-list.service';
import { createClubPromptResponse } from '../services/clubs/prompts/responses.service';

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
  return typeof req.params.responseId === 'string' ? req.params.responseId : '';
}

function handleClubPromptControllerError(
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

export async function createClubPromptController(req: Request, res: Response) {
  try {
    const prompt = await createClubPrompt({
      clubId: getClubId(req),
      authorId: getAuthenticatedUserId(req),
      type: req.body.type,
      content: req.body.content,
      maxAttempts: req.body.maxAttempts,
      expiresAt: req.body.expiresAt,
      difficulty: req.body.difficulty,
      attachments: req.body.attachments,
      isPinned: req.body.isPinned,
      isMembersOnly: req.body.isMembersOnly,
    });

    return res.status(201).json(prompt);
  } catch (error) {
    return handleClubPromptControllerError(
      res,
      error,
      'Erro interno ao criar prompt do clube',
    );
  }
}

export async function getClubPromptDetailController(
  req: Request,
  res: Response,
) {
  try {
    const prompt = await getClubPromptDetail({
      clubId: getClubId(req),
      promptId: getPromptId(req),
      viewerId: getAuthenticatedUserId(req),
    });

    return res.status(200).json(prompt);
  } catch (error) {
    return handleClubPromptControllerError(
      res,
      error,
      'Erro interno ao buscar prompt do clube',
    );
  }
}

export async function updateClubPromptController(req: Request, res: Response) {
  try {
    const prompt = await updateClubPrompt({
      ...req.body,
      clubId: getClubId(req),
      promptId: getPromptId(req),
      actorId: getAuthenticatedUserId(req),
    });

    return res.status(200).json(prompt);
  } catch (error) {
    return handleClubPromptControllerError(
      res,
      error,
      'Erro interno ao editar prompt do clube',
    );
  }
}

export async function moderateClubPromptController(
  req: Request,
  res: Response,
) {
  try {
    const prompt = await moderateClubPrompt({
      clubId: getClubId(req),
      promptId: getPromptId(req),
      actorId: getAuthenticatedUserId(req),
      removalReason: req.body?.removalReason,
    });

    return res.status(200).json(prompt);
  } catch (error) {
    return handleClubPromptControllerError(
      res,
      error,
      'Erro interno ao moderar prompt do clube',
    );
  }
}

export async function createClubPromptResponseController(
  req: Request,
  res: Response,
) {
  try {
    const response = await createClubPromptResponse({
      clubId: getClubId(req),
      promptId: getPromptId(req),
      userId: getAuthenticatedUserId(req),
      text: req.body.text,
      mediaUrl: req.body.mediaUrl,
      mediaType: req.body.mediaType,
      dareProofId: req.body.dareProofId,
    });

    return res.status(201).json(response);
  } catch (error) {
    return handleClubPromptControllerError(
      res,
      error,
      'Erro interno ao responder prompt do clube',
    );
  }
}

export async function listClubPromptResponsesController(
  req: Request,
  res: Response,
) {
  try {
    const responses = await listClubPromptResponses({
      clubId: getClubId(req),
      promptId: getPromptId(req),
      viewerId: getAuthenticatedUserId(req),
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
    });

    return res.status(200).json(responses);
  } catch (error) {
    return handleClubPromptControllerError(
      res,
      error,
      'Erro interno ao listar respostas do prompt do clube',
    );
  }
}

export async function createClubPromptCommentController(
  req: Request,
  res: Response,
) {
  try {
    const comment = await createClubPromptComment({
      clubId: getClubId(req),
      promptId: getPromptId(req),
      userId: getAuthenticatedUserId(req),
      text: req.body.text,
    });

    return res.status(201).json(comment);
  } catch (error) {
    return handleClubPromptControllerError(
      res,
      error,
      'Erro interno ao comentar prompt do clube',
    );
  }
}

export async function toggleClubPromptLikeController(
  req: Request,
  res: Response,
) {
  try {
    const result = await toggleClubPromptLike({
      clubId: getClubId(req),
      promptId: getPromptId(req),
      userId: getAuthenticatedUserId(req),
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleClubPromptControllerError(
      res,
      error,
      'Erro interno ao curtir prompt do clube',
    );
  }
}

export async function toggleClubPromptResponseLikeController(
  req: Request,
  res: Response,
) {
  try {
    const result = await toggleClubPromptResponseLike({
      clubId: getClubId(req),
      promptId: getPromptId(req),
      responseId: getResponseId(req),
      userId: getAuthenticatedUserId(req),
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleClubPromptControllerError(
      res,
      error,
      'Erro interno ao curtir resposta do prompt do clube',
    );
  }
}
