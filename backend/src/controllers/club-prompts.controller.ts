import { Request, Response } from 'express';
import { ClubServiceError } from '../services/clubs.service';
import { createClubPrompt } from '../services/club-prompts.service';

function getAuthenticatedUserId(req: Request) {
  return req.user?.sub ?? '';
}

function getClubId(req: Request) {
  return typeof req.params.id === 'string' ? req.params.id : '';
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
