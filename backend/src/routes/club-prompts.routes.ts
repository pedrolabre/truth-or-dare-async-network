import { Router } from 'express';
import {
  createClubPromptCommentController,
  createClubPromptController,
  createClubPromptResponseController,
  getClubPromptDetailController,
  listClubPromptResponsesController,
  moderateClubPromptController,
  updateClubPromptController,
} from '../controllers/club-prompts.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/:id/prompts', authMiddleware, createClubPromptController);
router.post(
  '/:id/prompts/:promptId/responses',
  authMiddleware,
  createClubPromptResponseController,
);
router.get(
  '/:id/prompts/:promptId/responses',
  authMiddleware,
  listClubPromptResponsesController,
);
router.post(
  '/:id/prompts/:promptId/comments',
  authMiddleware,
  createClubPromptCommentController,
);
router.get(
  '/:id/prompts/:promptId',
  authMiddleware,
  getClubPromptDetailController,
);
router.patch(
  '/:id/prompts/:promptId',
  authMiddleware,
  updateClubPromptController,
);
router.delete(
  '/:id/prompts/:promptId',
  authMiddleware,
  moderateClubPromptController,
);

export default router;
