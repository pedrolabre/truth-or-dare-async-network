import { Request, Response } from 'express';
import { ClubServiceError } from '../services/clubs.service';
import {
  createClubPrompt,
  getClubPromptDetail,
} from '../services/club-prompts.service';
import { updateClubPrompt } from '../services/club-prompts-edit.service';
import { moderateClubPrompt } from '../services/club-prompts-moderation.service';

function getAuthenticatedUserId(req: Request) {
  return req.user?.sub ?? '';
}

function getClubId(req: Request) {
  return typeof req.params.id === 'string' ? req.params.id : '';
}

function getPromptId(req: Request) {
  return typeof req.params.promptId === 'string' ? req.params.promptId : '';
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
